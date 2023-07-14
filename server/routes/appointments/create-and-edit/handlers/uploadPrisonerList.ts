import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import IsNotEmptyFile from '../../../../validators/isNotEmptyFile'
import IsValidCsvFile from '../../../../validators/isValidCsvFile'
import PrisonerListCsvParser from '../../../../utils/prisonerListCsvParser'

export class PrisonerList {
  @Expose()
  @IsNotEmpty({ message: 'You must select a file' })
  @IsNotEmptyFile({ message: 'The selected file is empty' })
  @IsValidCsvFile({ message: 'You must upload a CSV file' })
  file: Express.Multer.File
}

export default class UploadPrisonerListRoutes {
  constructor(
    private readonly prisonerListCsvParser: PrisonerListCsvParser,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { preserveHistory } = req.query

    res.render('pages/appointments/create-and-edit/upload-prisoner-list', { preserveHistory })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const prisonerList = await this.getPrisonerList(req, res, req.session.appointmentJourney.prisoners)
    if (!prisonerList) return

    req.session.appointmentJourney.prisoners = prisonerList

    res.redirect(`review-prisoners${req.query.preserveHistory ? '?preserveHistory=true' : ''}`)
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const prisonerList = await this.getPrisonerList(req, res, req.session.editAppointmentJourney.addPrisoners)
    if (!prisonerList) return

    req.session.editAppointmentJourney.addPrisoners = prisonerList

    res.redirect('review-prisoners')
  }

  private getPrisonerList = async (
    req: Request,
    res: Response,
    existingPrisoners: {
      number: string
      name: string
      cellLocation: string
    }[],
  ) => {
    const prisonerListCsvFile = req.file
    const { user } = res.locals

    const prisonerNumbers = await this.prisonerListCsvParser.getPrisonNumbers(prisonerListCsvFile)

    if (prisonerNumbers.length === 0) {
      res.validationFailed('file', 'The selected file does not contain any prison numbers')
      return false
    }

    const prisoners = (await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user))
      .filter(prisoner => prisoner.prisonId === user.activeCaseLoadId)
      .map(prisoner => ({
        number: prisoner.prisonerNumber,
        name: `${prisoner.firstName} ${prisoner.lastName}`,
        cellLocation: prisoner.cellLocation,
      }))

    const prisonerNumbersFound = prisoners.map(prisoner => prisoner.number)

    const prisonerNumbersNotFound = prisonerNumbers.filter(
      prisonerNumber => !prisonerNumbersFound.includes(prisonerNumber),
    )

    if (prisonerNumbersNotFound.length > 0) {
      const message =
        prisonerNumbersNotFound.length === 1
          ? `The prison number '${prisonerNumbersNotFound[0]}' was not recognised`
          : `The following prison numbers '${prisonerNumbersNotFound.join("', '")}' were not recognised`
      res.validationFailed('file', message)
      return false
    }

    const existingPrisonersNotInUploadedList = (existingPrisoners ?? []).filter(
      prisoner => !prisonerNumbersFound.includes(prisoner.number),
    )

    return existingPrisonersNotInUploadedList.concat(prisoners)
  }
}
