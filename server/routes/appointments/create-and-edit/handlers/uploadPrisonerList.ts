import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import IsNotEmptyFile from '../../../../validators/isNotEmptyFile'
import IsValidCsvFile from '../../../../validators/isValidCsvFile'
import PrisonerListCsvParser from '../../../../utils/prisonerListCsvParser'

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
    const prisonerListCsvFile = req.file
    const { user } = res.locals

    const prisonerNumbers = await this.prisonerListCsvParser.getPrisonerNumbers(prisonerListCsvFile)

    if (prisonerNumbers.length === 0) {
      return res.validationFailed('file', 'The selected file does not contain any prisoner numbers')
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
          ? `Prisoner with number ${prisonerNumbersNotFound[0]} was not found`
          : `Prisoners with numbers ${prisonerNumbersNotFound.join(', ')} were not found`
      return res.validationFailed('file', message)
    }

    const existingPrisonersNotInUploadedList = (req.session.appointmentJourney.prisoners ?? []).filter(
      prisoner => !prisonerNumbersFound.includes(prisoner.number),
    )

    req.session.appointmentJourney.prisoners = existingPrisonersNotInUploadedList.concat(prisoners)

    return res.redirect('review-prisoners')
  }
}
