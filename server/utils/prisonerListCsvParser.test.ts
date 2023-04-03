import { promises as fsPromises } from 'fs'
import PrisonerListCsvParser from './prisonerListCsvParser'
import { FormValidationError } from '../middleware/formValidationErrorHandler'

jest.spyOn(fsPromises, 'unlink').mockImplementation(path => {
  if (path === 'server/utils/fixtures/not-found.csv') return Promise.reject()
  return Promise.resolve()
})

describe('getPrisonerNumbers', () => {
  const parser = new PrisonerListCsvParser()

  it('should throw validation error when file not found', async () => {
    let exception
    try {
      await parser.getPrisonerNumbers({ path: 'server/utils/fixtures/not-found.csv' } as unknown as Express.Multer.File)
    } catch (e) {
      exception = e
    }

    expect(exception).toBeInstanceOf(FormValidationError)
    expect((exception as FormValidationError).field).toEqual('file')
    expect((exception as FormValidationError).message).toEqual('The selected file could not be uploaded – try again')
    expect(fsPromises.unlink).toHaveBeenCalled()
  })

  it('should throw validation error when file is not CSV', async () => {
    let exception
    try {
      await parser.getPrisonerNumbers({
        path: 'server/utils/fixtures/non-csv-file.xlsx',
      } as unknown as Express.Multer.File)
    } catch (e) {
      exception = e
    }

    expect(exception).toBeInstanceOf(FormValidationError)
    expect((exception as FormValidationError).field).toEqual('file')
    expect((exception as FormValidationError).message).toEqual('The selected file must use the template')
    expect(fsPromises.unlink).toHaveBeenCalled()
  })

  it('should return no prisoner numbers when file is empty', async () => {
    const prisonerNumbers = await parser.getPrisonerNumbers({
      path: 'server/utils/fixtures/empty-upload-prisoner-list.csv',
    } as unknown as Express.Multer.File)

    expect(prisonerNumbers.length).toBe(0)
    expect(fsPromises.unlink).toHaveBeenCalled()
  })

  it('should return prisoner numbers without header row', async () => {
    const prisonerNumbers = await parser.getPrisonerNumbers({
      path: 'server/utils/fixtures/upload-prisoner-list.csv',
    } as unknown as Express.Multer.File)

    expect(prisonerNumbers).toEqual(['A1234BC', 'B2345CD'])
    expect(fsPromises.unlink).toHaveBeenCalled()
  })

  it('should return prisoner numbers when header row not included', async () => {
    const prisonerNumbers = await parser.getPrisonerNumbers({
      path: 'server/utils/fixtures/upload-prisoner-list-no-header.csv',
    } as unknown as Express.Multer.File)

    expect(prisonerNumbers).toEqual(['A1234BC', 'B2345CD'])
    expect(fsPromises.unlink).toHaveBeenCalled()
  })

  it('should return unique prisoner numbers', async () => {
    const prisonerNumbers = await parser.getPrisonerNumbers({
      path: 'server/utils/fixtures/upload-prisoner-list-duplicates.csv',
    } as unknown as Express.Multer.File)

    expect(prisonerNumbers).toEqual(['A1234BC', 'B2345CD'])
    expect(fsPromises.unlink).toHaveBeenCalled()
  })
})
