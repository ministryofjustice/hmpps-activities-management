import fs from 'fs'
import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../utils/utils'
import IsValidCsvFile from './isValidCsvFile'

jest.mock('fs')
jest.mock('isbinaryfile', () => ({
  isBinaryFileSync: jest.fn(file => file === 'uploads/non-csv.csv'),
}))

const fsMock: jest.Mocked<typeof fs> = <jest.Mocked<typeof fs>>fs

describe('isValidCsvFile', () => {
  class DummyForm {
    @Expose()
    @IsValidCsvFile({ message: 'The selected file must be a CSV' })
    file: Express.Multer.File
  }

  afterEach(() => {
    fsMock.existsSync.mockClear()
    fsMock.unlinkSync.mockClear()
  })

  it('should pass validation for undefined file', async () => {
    const body = {}

    const requestObject = plainToInstance(DummyForm, body)

    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
    expect(fsMock.unlinkSync).not.toHaveBeenCalled()
  })

  it('should pass validation for file not found', async () => {
    const body = {
      file: {
        path: 'uploads/not-found.csv',
      },
    }

    const requestObject = plainToInstance(DummyForm, body)

    when(fsMock.existsSync).calledWith('uploads/not-found.csv').mockReturnValue(false)

    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
    expect(fsMock.unlinkSync).not.toHaveBeenCalled()
  })

  it('should fail validation for a binary file', async () => {
    const body = {
      file: {
        path: 'uploads/non-csv.csv',
        mimetype: 'text/csv',
      },
    }

    const requestObject = plainToInstance(DummyForm, body)

    when(fsMock.existsSync).calledWith('uploads/non-csv.csv').mockReturnValue(true)

    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'file', error: 'The selected file must be a CSV' }])
    expect(fsMock.unlinkSync).toHaveBeenCalledWith('uploads/non-csv.csv')
  })

  it('should pass validation for a csv file', async () => {
    const body = {
      file: {
        path: 'uploads/valid.csv',
        mimetype: 'text/csv',
      },
    }

    const requestObject = plainToInstance(DummyForm, body)

    when(fsMock.existsSync).calledWith('uploads/valid.csv').mockReturnValue(true)

    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
    expect(fsMock.unlinkSync).not.toHaveBeenCalled()
  })
})
