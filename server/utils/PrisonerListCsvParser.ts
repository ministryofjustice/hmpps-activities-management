import fs, { promises as fsPromises } from 'fs'
import { parse } from 'csv-parse'
import { finished } from 'stream/promises'
import { FormValidationError } from '../middleware/formValidationErrorHandler'

export default class PrisonerListCsvParser {
  getPrisonerNumbers = async (file: Express.Multer.File): Promise<string[]> => {
    const prisonerNumbers: string[] = []
    const streamErrors: string[] = []
    const parserErrors: string[] = []

    const stream = fs.createReadStream(file.path)
    stream.on('error', error => {
      streamErrors.push(error.message)
    })

    const parser = stream.pipe(parse({ trim: true, skipEmptyLines: true }))

    parser.on('error', error => {
      parserErrors.push(error.message)
    })

    parser.on('readable', () => {
      let row
      // eslint-disable-next-line no-cond-assign
      while ((row = parser.read())) {
        const prisonerNumber = row[0]
        if (prisonerNumber !== 'Prison number' && !prisonerNumbers.includes(prisonerNumber)) {
          prisonerNumbers.push(prisonerNumber)
        }
      }
    })

    await finished(parser)

    try {
      await fsPromises.unlink(file.path)
    } catch {
      /* empty */
    }

    if (streamErrors.length > 0) {
      throw new FormValidationError('file', 'The selected file could not be uploaded – try again')
    }

    if (parserErrors.length > 0) {
      throw new FormValidationError('file', 'The selected file must use the template')
    }

    return prisonerNumbers
  }
}
