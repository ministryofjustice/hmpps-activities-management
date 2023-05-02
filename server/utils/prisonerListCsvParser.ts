import { promises as fsPromises } from 'fs'
import { parse } from 'csv-parse'
import { finished } from 'stream/promises'
import { FormValidationError } from '../middleware/formValidationErrorHandler'

export default class PrisonerListCsvParser {
  async getPrisonerNumbers(file: Express.Multer.File): Promise<string[]> {
    let data
    try {
      data = await fsPromises.readFile(file.path)
    } catch {
      throw new FormValidationError('file', 'The selected file could not be uploaded – try again')
    } finally {
      await fsPromises.unlink(file.path).catch(_ => true)
    }

    const prisonerNumbers: string[] = []

    const parser = parse(data, { trim: true, skipEmptyLines: true }).on('readable', () => {
      let row
      // eslint-disable-next-line no-cond-assign
      while ((row = parser.read())) {
        const prisonerNumber = row[0]
        if (prisonerNumber !== 'Prison number' && !prisonerNumbers.includes(prisonerNumber)) {
          prisonerNumbers.push(prisonerNumber)
        }
      }
    })

    try {
      await finished(parser)
    } catch {
      throw new FormValidationError('file', 'The selected file must use the CSV template')
    }

    return prisonerNumbers
  }
}
