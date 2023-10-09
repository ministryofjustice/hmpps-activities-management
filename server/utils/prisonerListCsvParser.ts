import { promises as fsPromises } from 'fs'
import { parse } from 'csv-parse'
import { finished } from 'stream/promises'
import { FormValidationError } from '../middleware/formValidationErrorHandler'

export default class PrisonerListCsvParser {
  async getPrisonNumbers(file: Express.Multer.File): Promise<string[]> {
    const rows = await this.readCsvValues(file)

    return rows.map(row => row[0])
  }

  async getAppointments(file: Express.Multer.File) {
    const rows = await this.readCsvValues(file)
    return rows.map(row => {
      const [prisonerNumber, startTimeString, endTimeString] = row

      // TODO: Confirm time validation rules and error messages
      // This simply prevents errors while processing
      const timeRegex = /^([01][0-9]|2[0-3]):([0-5][0-9])$/

      let startTime = null
      if (startTimeString?.match(timeRegex)) {
        const startTimeParts = startTimeString.split(':')
        startTime = {
          hour: parseInt(startTimeParts[0], 10),
          minute: parseInt(startTimeParts[1], 10),
        }
      }

      let endTime = null
      if (endTimeString?.match(timeRegex)) {
        const endTimeParts = endTimeString.split(':')
        endTime = {
          hour: parseInt(endTimeParts[0], 10),
          minute: parseInt(endTimeParts[1], 10),
        }
      }

      return {
        prisonerNumber,
        startTime,
        endTime,
      }
    })
  }

  async readCsvValues(file: Express.Multer.File) {
    let data
    try {
      data = await fsPromises.readFile(file.path)
    } catch {
      throw new FormValidationError('file', 'The selected file could not be uploaded – try again')
    } finally {
      await fsPromises.unlink(file.path).catch(_ => true)
    }

    const rowValues: string[][] = []

    const parser = parse(data, { trim: true, skipEmptyLines: true }).on('readable', () => {
      let row
      // eslint-disable-next-line no-cond-assign
      while ((row = parser.read())) {
        const [prisonerNumber] = row
        if (
          prisonerNumber &&
          prisonerNumber !== 'Prison number' &&
          !rowValues.map(i => i[0]).includes(prisonerNumber)
        ) {
          rowValues.push(row)
        }
      }
    })

    try {
      await finished(parser)
    } catch {
      throw new FormValidationError('file', 'The selected file must use the CSV template')
    }

    return rowValues
  }
}
