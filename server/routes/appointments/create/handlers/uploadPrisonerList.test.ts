import fs, { Stats } from 'fs'
import fsPromises from 'fs/promises'
import { parse, Parser } from 'csv-parse'
import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import UploadPrisonerListRoutes, { PrisonerList } from './uploadPrisonerList'
import PrisonService from '../../../../services/prisonService'
import { when } from 'jest-when'

jest.mock('fs')
jest.mock('fs/promises')
jest.mock('csv-parse')
jest.mock('isbinaryfile', () => ({
  isBinaryFileSync: jest.fn(file => file === 'uploads/non-csv.csv'),
}))
jest.mock('../../../../services/prisonService')

const fsMock: jest.Mocked<typeof fs> = <jest.Mocked<typeof fs>>fs
const fsPromisesMock = fsPromises as jest.Mocked<typeof fsPromises>
const parseMock = parse as jest.Mocked<typeof parse>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Create Appointment - Upload Prisoner List', () => {
  const handler = new UploadPrisonerListRoutes(prisonService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'test.user',
          activeCaseLoadId: 'TPR',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createAppointmentJourney: {},
      },
      flash: jest.fn(),
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the upload prisoner list view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create/upload-prisoner-list')
    })
  })

  describe('POST', () => {
    it('validation fails when uploaded file could not be read', async () => {
      req.file = {
        path: 'uploads/unknown.csv',
      } as unknown as Express.Multer.File

      fsPromisesMock.readFile.mockRejectedValue(null)

      await handler.POST(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith('file', 'The selected file could not be uploaded – try again')
    })

    it('validation fails when uploaded file could not be parsed', async () => {
      req.file = {
        path: 'uploads/invalid.csv',
      } as unknown as Express.Multer.File

      fsPromisesMock.readFile.mockResolvedValue(null)

      const parser = {
        on: jest.fn(), // needs to fail and call .on('error'
      }

      // when(parseMock).calledWith(null).mockResolvedValue(parser)

      await handler.POST(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith('file', 'The selected file must use the template')
    })
  })

  describe('Validation', () => {
    it('validation fails when no file is uploaded', async () => {
      const body = {}

      const requestObject = plainToInstance(PrisonerList, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ property: 'file', error: "Select a CSV file of prisoners' numbers" }]),
      )
    })

    it('validation fails when empty CSV file is uploaded', async () => {
      const body = {
        file: {
          path: 'uploads/empty.csv',
        },
      }

      const requestObject = plainToInstance(PrisonerList, body)

      fsMock.existsSync.mockReturnValue(true)
      fsMock.lstatSync.mockReturnValue(plainToInstance(Stats, { size: 0 }))

      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'file', error: 'The selected file is empty' }]))
    })

    it('validation fails when invalid CSV file is uploaded', async () => {
      const body = {
        file: {
          path: 'uploads/non-csv.xlsx',
          mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      }

      const requestObject = plainToInstance(PrisonerList, body)

      fsMock.existsSync.mockReturnValue(true)
      fsMock.lstatSync.mockReturnValue(plainToInstance(Stats, { size: 1 }))

      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'file', error: 'The selected file must be a CSV' }]))
    })

    it('passes validation when valid CSV file is uploaded', async () => {
      const body = {
        file: {
          path: 'uploads/valid.csv',
          mimetype: 'text/csv',
        },
      }

      const requestObject = plainToInstance(PrisonerList, body)

      fsMock.existsSync.mockReturnValue(true)
      fsMock.lstatSync.mockReturnValue(plainToInstance(Stats, { size: 1 }))

      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
