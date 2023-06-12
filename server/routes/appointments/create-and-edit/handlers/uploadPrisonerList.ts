import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import IsNotEmptyFile from '../../../../validators/isNotEmptyFile'
import IsValidCsvFile from '../../../../validators/isValidCsvFile'
import PrisonerListCsvParser from '../../../../utils/prisonerListCsvParser'
import {
  getAppointmentPrisonerNonAssociations,
  getAppointmentPrisonersAdd,
  getRelevantAppointmentAlerts,
} from '../../../../utils/appointmentUtils'
import { AppointmentPrisoner } from '../../../../@types/appointments'

export class PrisonerList {
  @Expose()
  @IsNotEmpty({ message: "Select a CSV file of prisoners' numbers" })
  @IsNotEmptyFile({ message: 'The selected file is empty' })
  @IsValidCsvFile({ message: 'The selected file must be a CSV' })
  file: Express.Multer.File
}

export default class UploadPrisonerListRoutes {
  constructor(
    private readonly prisonerListCsvParser: PrisonerListCsvParser,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-and-edit/upload-prisoner-list')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const prisonerList = await this.getPrisonerList(req, res, req.session.appointmentJourney.prisoners)
    if (!prisonerList) return

    req.session.appointmentJourney.prisoners = prisonerList

    res.redirect('review-prisoners')
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const prisonerList = await this.getPrisonerList(req, res, req.session.editAppointmentJourney.addPrisoners)
    if (!prisonerList) return

    req.session.editAppointmentJourney.addPrisoners = prisonerList

    res.redirect('review-prisoners')
  }

  private getPrisonerList = async (req: Request, res: Response, existingPrisoners: AppointmentPrisoner[]) => {
    const prisonerListCsvFile = req.file
    const { user } = res.locals

    const prisonerNumbers = await this.prisonerListCsvParser.getPrisonNumbers(prisonerListCsvFile)

    if (prisonerNumbers.length === 0) {
      res.validationFailed('file', 'The selected file does not contain any prison numbers')
      return false
    }

    const prisonersFound = (await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user)).filter(
      prisoner => prisoner.prisonId === user.activeCaseLoadId,
    )

    const prisonerNumbersFound = prisonersFound.map(prisoner => prisoner.prisonerNumber)

    const prisonerNumbersNotFound = prisonerNumbers.filter(
      prisonerNumber => !prisonerNumbersFound.includes(prisonerNumber),
    )

    if (prisonerNumbersNotFound.length > 0) {
      const message =
        prisonerNumbersNotFound.length === 1
          ? `Prisoner with number ${prisonerNumbersNotFound[0]} was not found`
          : `Prisoners with numbers ${prisonerNumbersNotFound.join(', ')} were not found`
      res.validationFailed('file', message)
      return false
    }

    const prisonersNonAssociationDetails = await this.prisonService.getPrisonersNonAssociationDetails(
      prisonerNumbersFound,
      user,
    )

    const newPrisoners = prisonersFound.map(prisoner => ({
      name: `${prisoner.firstName} ${prisoner.lastName}`,
      number: prisoner.prisonerNumber,
      cellLocation: prisoner.cellLocation,
      category: prisoner.category,
      alerts: getRelevantAppointmentAlerts(prisoner.alerts),
      nonAssociations: getAppointmentPrisonerNonAssociations(
        prisonersNonAssociationDetails?.get(prisoner.prisonerNumber),
      ),
    }))

    return getAppointmentPrisonersAdd(existingPrisoners, ...newPrisoners)
  }
}
