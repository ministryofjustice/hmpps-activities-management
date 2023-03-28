import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { parse } from 'csv-parse'
import PrisonService from '../../../../services/prisonService'

export class PrisonerList {
  @Expose()
  @IsNotEmpty({ message: 'Select a file' })
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

    const prisonerNumbers: string[] = []

    const parser = parse(prisonerListCsvFile.buffer, { trim: true, skip_empty_lines: true })
      .on('readable', () => {
        let row
        // eslint-disable-next-line no-cond-assign
        while ((row = parser.read())) {
          prisonerNumbers.push(row[0])
        }
      })
      .on('end', async () => {
        const prisoners = await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user)

        req.session.createAppointmentJourney.prisoners = prisoners.map(prisoner => ({
          number: prisoner.prisonerNumber,
          name: `${prisoner.firstName} ${prisoner.lastName}`,
          cellLocation: prisoner.cellLocation,
        }))

        return res.redirectOrReturn('category')
      })
  }
}
