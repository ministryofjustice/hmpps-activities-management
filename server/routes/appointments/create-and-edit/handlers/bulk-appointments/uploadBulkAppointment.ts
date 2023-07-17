import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../../../services/prisonService'
import IsNotEmptyFile from '../../../../../validators/isNotEmptyFile'
import IsValidCsvFile from '../../../../../validators/isValidCsvFile'
import PrisonerListCsvParser from '../../../../../utils/prisonerListCsvParser'
import { ServiceUser } from '../../../../../@types/express'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'

export class AppointmentsList {
  @Expose()
  @IsValidCsvFile({ message: 'You must upload a CSV file' })
  @IsNotEmptyFile({ message: 'The selected file is empty' })
  @IsNotEmpty({ message: 'You must select a file' })
  file: Express.Multer.File
}

export default class UploadBulkAppointment {
  constructor(
    private readonly prisonerListCsvParser: PrisonerListCsvParser,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { preserveHistory } = req.query

    res.render('pages/appointments/create-and-edit/bulk-appointments/upload-bulk-appointment', { preserveHistory })
  }

  POST = async (req: Request, res: Response) => {
    const prisonerListCsvFile = req.file
    const { user } = res.locals

    const appointmentInstances = await this.prisonerListCsvParser.getAppointments(prisonerListCsvFile)

    if (appointmentInstances.length === 0) {
      res.validationFailed('file', 'The selected file does not contain any prison numbers')
      return false
    }

    const newPrisonerNumbers = appointmentInstances.map(instance => instance.prisonerNumber)

    const prisonersDetails = await this.getPrisonerDetails(newPrisonerNumbers, user)
    const prisonerNumbersNotFound = this.getNotFoundPrisoners(newPrisonerNumbers, prisonersDetails)

    if (prisonerNumbersNotFound.length > 0) {
      const message =
        prisonerNumbersNotFound.length === 1
          ? `Prisoner with number ${prisonerNumbersNotFound[0]} was not found`
          : `Prisoners with numbers ${prisonerNumbersNotFound.join(', ')} were not found`

      res.validationFailed('file', message)
      return false
    }

    const newInstances = appointmentInstances.map(instance => {
      const prisonerDetails = prisonersDetails.get(instance.prisonerNumber)

      return {
        prisoner: {
          number: prisonerDetails.prisonerNumber,
          name: `${prisonerDetails.firstName} ${prisonerDetails.lastName}`,
          cellLocation: prisonerDetails.cellLocation,
        },
        startTime: instance.startTime,
        endTime: instance.endTime,
      }
    })

    req.session.bulkAppointmentJourney.appointments = newInstances

    return res.redirect(`review-prisoners${req.query.preserveHistory ? '?preserveHistory=true' : ''}`)
  }

  private async getPrisonerDetails(prisonerNumbers: string[], user: ServiceUser) {
    return (await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user))
      .filter(prisoner => prisoner.prisonId === user.activeCaseLoadId)
      .reduce(
        (prisonerMap, prisoner) => prisonerMap.set(prisoner.prisonerNumber, prisoner),
        new Map<string, Prisoner>(),
      )
  }

  private getNotFoundPrisoners(newPrisonerNumbers: string[], prisonerDetails: Map<string, Prisoner>) {
    return newPrisonerNumbers.filter(newPrisonerNumber => !prisonerDetails.has(newPrisonerNumber))
  }
}
