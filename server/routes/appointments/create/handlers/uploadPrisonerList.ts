import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { parse } from 'csv-parse'
import fs from 'fs'
import PrisonService from '../../../../services/prisonService'
import IsNotEmptyFile from '../../../../validators/isNotEmptyFile'
import IsValidCsvFile from '../../../../validators/isValidCsvFile'
import { ServiceUser } from '../../../../@types/express'

export class PrisonerList {
  @Expose()
  @IsNotEmpty({ message: "Select a CSV file of prisoners' numbers" })
  @IsNotEmptyFile({ message: 'The selected file is empty' })
  @IsValidCsvFile({ message: 'The selected file must be a CSV' })
  file: Express.Multer.File
}

export default class UploadPrisonerListRoutes {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render(`pages/appointments/create/upload-prisoner-list`)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const prisonerListCsvFile = req.file
    const { user } = res.locals

    fs.promises
      .readFile(prisonerListCsvFile.path)
      .then(result => {
        fs.promises.unlink(prisonerListCsvFile.path)
        this.parsePrisonerList(result, req, res, user)
      })
      .catch(() => {
        fs.promises.unlink(prisonerListCsvFile.path)
        return res.validationFailed('file', 'The selected file could not be uploaded – try again')
      })
  }

  private async parsePrisonerList(result: Buffer, req: Request, res: Response, user: ServiceUser) {
    const prisonerNumbers: string[] = []
    const errors: string[] = []

    const parser = parse(result, { trim: true, skipEmptyLines: true })
      .on('readable', () => {
        let row
        // eslint-disable-next-line no-cond-assign
        while ((row = parser.read())) {
          const prisonerNumber = row[0]
          if (prisonerNumber !== 'Prison number' && !prisonerNumbers.includes(prisonerNumber)) {
            prisonerNumbers.push(prisonerNumber)
          }
        }
      })
      .on('error', error => {
        errors.push(error.message)
      })
      .on('end', async () => {
        if (errors.length > 0) {
          return res.validationFailed('file', 'The selected file must use the template')
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

        const existingPrisonersNotInUploadedList = (req.session.createAppointmentJourney.prisoners ?? []).filter(
          prisoner => !prisonerNumbersFound.includes(prisoner.number),
        )

        req.session.createAppointmentJourney.prisoners = existingPrisonersNotInUploadedList.concat(prisoners)

        return res.redirect('review-prisoners')
      })
  }
}
