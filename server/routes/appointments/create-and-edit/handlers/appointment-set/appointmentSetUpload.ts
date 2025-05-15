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

type AppointmentJourneyInfo = {
  prisonerNumber: string
  startTime: {
    hour: number
    minute: number
  }
  endTime: {
    hour: number
    minute: number
  }
}

export default class AppointmentSetUploadRoutes {
  constructor(
    private readonly prisonerListCsvParser: PrisonerListCsvParser,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { preserveHistory } = req.query

    res.render('pages/appointments/create-and-edit/appointment-set/upload', { preserveHistory })
  }

  POST = async (req: Request, res: Response) => {
    const appointments = await this.getAppointmentInstances(req, res)
    if (!appointments) return

    req.session.appointmentSetJourney.appointments = appointments

    res.redirect(`review-prisoners${req.query.preserveHistory ? '?preserveHistory=true' : ''}`)
  }

  private getAppointmentInstances = async (req: Request, res: Response) => {
    const { file } = req
    const { user } = res.locals

    const appointmentInstances = await this.prisonerListCsvParser.getAppointments(file)

    if (appointmentInstances.length === 0) {
      res.validationFailed('file', 'The selected file does not contain any prison numbers')
      return false
    }

    const prisonerNumbers = appointmentInstances.map(a => a.prisonerNumber)
    const prisonerDetails = await this.fetchPrisonerDetails(prisonerNumbers, user)

    const notFound = prisonerNumbers.filter(num => !prisonerDetails.has(num))
    if (notFound.length) {
      req.session.appointmentSetJourney.prisonersNotFound = notFound
    }

    const availableAppointments: AppointmentJourneyInfo[] = appointmentInstances.filter(
      a => !notFound.includes(a.prisonerNumber),
    )

    return availableAppointments.map(instance => {
      const prisoner = prisonerDetails.get(instance.prisonerNumber)
      return {
        prisoner: {
          number: prisoner.prisonerNumber,
          name: `${prisoner.firstName} ${prisoner.lastName}`,
          firstName: prisoner.firstName,
          lastName: prisoner.lastName,
          prisonCode: prisoner.prisonId,
          status: prisoner.status,
          cellLocation: prisoner.cellLocation,
        },
        startTime: instance.startTime,
        endTime: instance.endTime,
      }
    })
  }

  async fetchPrisonerDetails(prisonerNumbers: string[], user: ServiceUser): Promise<Map<string, Prisoner>> {
    const results = await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user)
    return new Map(results.filter(p => p.prisonId === user.activeCaseLoadId).map(p => [p.prisonerNumber, p]))
  }
}
