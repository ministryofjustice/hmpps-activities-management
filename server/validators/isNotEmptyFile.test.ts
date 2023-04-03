import fs, { Stats } from 'fs'
import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../utils/utils'
import IsNotEmptyFile from './isNotEmptyFile'

jest.mock('fs')

const fsMock: jest.Mocked<typeof fs> = <jest.Mocked<typeof fs>>fs

describe('isNotEmptyFile', () => {
  class DummyForm {
    @Expose()
    @IsNotEmptyFile({ message: 'The selected file is empty' })
    file: Express.Multer.File
  }

  afterEach(() => {
    jest.resetAllMocks()
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

  it('should fail validation for an empty file', async () => {
    const body = {
      file: {
        path: 'uploads/empty.csv',
      },
    }

    const requestObject = plainToInstance(DummyForm, body)

    when(fsMock.existsSync).calledWith('uploads/empty.csv').mockReturnValue(true)
    when(fsMock.lstatSync)
      .calledWith('uploads/empty.csv')
      .mockReturnValue(plainToInstance(Stats, { size: 0 }))

    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'file', error: 'The selected file is empty' }])
    expect(fsMock.unlinkSync).toHaveBeenCalledWith('uploads/empty.csv')
  })

  it('should pass validation for a non empty file', async () => {
    const body = {
      file: {
        path: 'uploads/not-empty.csv',
      },
    }

    const requestObject = plainToInstance(DummyForm, body)

    when(fsMock.existsSync).calledWith('uploads/not-empty.csv').mockReturnValue(true)
    when(fsMock.lstatSync)
      .calledWith('uploads/not-empty.csv')
      .mockReturnValue(plainToInstance(Stats, { size: 1 }))

    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
    expect(fsMock.unlinkSync).not.toHaveBeenCalled()
  })
})
