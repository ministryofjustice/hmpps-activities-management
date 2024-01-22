import fs, { Stats } from 'fs'
import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import UploadPrisonerListRoutes, { PrisonerList } from './uploadPrisonerList'
import PrisonerListCsvParser from '../../../../utils/prisonerListCsvParser'
import PrisonService from '../../../../services/prisonService'
import { FormValidationError } from '../../../../middleware/formValidationErrorHandler'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'

jest.mock('fs')
jest.mock('isbinaryfile', () => ({
  isBinaryFileSync: jest.fn(file => file === 'uploads/non-csv.csv'),
}))
jest.mock('../../../../utils/prisonerListCsvParser')
jest.mock('../../../../services/prisonService')

const fsMock: jest.Mocked<typeof fs> = <jest.Mocked<typeof fs>>fs
const prisonerListCsvParser = new PrisonerListCsvParser() as jest.Mocked<PrisonerListCsvParser>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Create Appointment - Upload Prisoner List', () => {
  const handler = new UploadPrisonerListRoutes(prisonerListCsvParser, prisonService)
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
        appointmentJourney: {},
      },
      query: {},
      flash: jest.fn(),
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the upload prisoner list view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/upload-prisoner-list', {
        preserveHistory: undefined,
      })
    })

    it('should render the upload prisoner list view with preserve history', async () => {
      req.query = { preserveHistory: 'true' }

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/upload-prisoner-list', {
        preserveHistory: 'true',
      })
    })
  })

  describe('POST', () => {
    it('validation fails when uploaded file could not be read', async () => {
      req.file = {
        path: 'uploads/unknown.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getPrisonNumbers)
        .calledWith(req.file)
        .mockImplementation(() => {
          throw new FormValidationError('file', 'The selected file could not be uploaded – try again')
        })

      let exception
      try {
        await handler.POST(req, res)
      } catch (e) {
        exception = e
      }

      expect(exception).toBeInstanceOf(FormValidationError)
      expect((exception as FormValidationError).field).toEqual('file')
      expect((exception as FormValidationError).message).toEqual('The selected file could not be uploaded – try again')
    })

    it('validation fails when uploaded file could not be parsed', async () => {
      req.file = {
        path: 'uploads/unknown.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getPrisonNumbers)
        .calledWith(req.file)
        .mockImplementation(() => {
          throw new FormValidationError('file', 'The selected file must use the CSV template')
        })

      let exception
      try {
        await handler.POST(req, res)
      } catch (e) {
        exception = e
      }

      expect(exception).toBeInstanceOf(FormValidationError)
      expect((exception as FormValidationError).field).toEqual('file')
      expect((exception as FormValidationError).message).toEqual('The selected file must use the CSV template')
    })

    it('validation fails when uploaded file does not contain any prison numbers', async () => {
      req.file = {
        path: 'uploads/no-prisoner-numbers.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getPrisonNumbers).calledWith(req.file).mockReturnValue(Promise.resolve([]))

      await handler.POST(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith('file', 'The selected file does not contain any prison numbers')
    })

    it('validation fails when single prisoner not found', async () => {
      req.file = {
        path: 'uploads/unknown.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getPrisonNumbers)
        .calledWith(req.file)
        .mockReturnValue(Promise.resolve(['A1234BC']))
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['A1234BC'], res.locals.user)
        .mockResolvedValue([] as Prisoner[])

      await handler.POST(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith('file', "The prison number 'A1234BC' was not recognised")
    })

    it('validation fails when two prisoners not found', async () => {
      req.file = {
        path: 'uploads/unknown.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getPrisonNumbers)
        .calledWith(req.file)
        .mockReturnValue(Promise.resolve(['A1234BC', 'B2345CD']))
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['A1234BC', 'B2345CD'], res.locals.user)
        .mockResolvedValue([] as Prisoner[])

      await handler.POST(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith(
        'file',
        "The following prison numbers 'A1234BC', 'B2345CD' were not recognised",
      )
    })

    it('validation fails when prisoner not in active case load', async () => {
      req.file = {
        path: 'uploads/two-prisoners.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getPrisonNumbers)
        .calledWith(req.file)
        .mockReturnValue(Promise.resolve(['A1234BC', 'B2345CD']))
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['A1234BC', 'B2345CD'], res.locals.user)
        .mockResolvedValue([
          {
            prisonerNumber: 'A1234BC',
            firstName: 'TEST01',
            lastName: 'PRISONER01',
            prisonId: 'TPR',
            cellLocation: '1-1-1',
          },
          {
            prisonerNumber: 'B2345CD',
            firstName: 'TEST02',
            lastName: 'PRISONER02',
            prisonId: 'NOTTPR',
            cellLocation: '2-2-2',
          },
        ] as Prisoner[])

      await handler.POST(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith('file', "The prison number 'B2345CD' was not recognised")
    })

    it('should save found prisoners in session and redirect to review prisoners', async () => {
      req.file = {
        path: 'uploads/two-prisoners.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getPrisonNumbers)
        .calledWith(req.file)
        .mockReturnValue(Promise.resolve(['A1234BC', 'B2345CD']))
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['A1234BC', 'B2345CD'], res.locals.user)
        .mockResolvedValue([
          {
            prisonerNumber: 'A1234BC',
            firstName: 'TEST01',
            lastName: 'PRISONER01',
            prisonId: 'TPR',
            cellLocation: '1-1-1',
            status: 'ACTIVE IN',
          },
          {
            prisonerNumber: 'B2345CD',
            firstName: 'TEST02',
            lastName: 'PRISONER02',
            prisonId: 'TPR',
            cellLocation: '2-2-2',
            status: 'ACTIVE IN',
          },
        ] as Prisoner[])

      await handler.POST(req, res)

      expect(req.session.appointmentJourney.prisoners).toEqual([
        {
          number: 'A1234BC',
          name: 'TEST01 PRISONER01',
          cellLocation: '1-1-1',
          prisonCode: 'TPR',
          status: 'ACTIVE IN',
        },
        {
          number: 'B2345CD',
          name: 'TEST02 PRISONER02',
          cellLocation: '2-2-2',
          prisonCode: 'TPR',
          status: 'ACTIVE IN',
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('review-prisoners')
    })

    it('should save found prisoners in session and redirect to review prisoners with preserve history', async () => {
      req.query = { preserveHistory: 'true' }
      req.file = {
        path: 'uploads/two-prisoners.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getPrisonNumbers)
        .calledWith(req.file)
        .mockReturnValue(Promise.resolve(['A1234BC', 'B2345CD']))
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['A1234BC', 'B2345CD'], res.locals.user)
        .mockResolvedValue([
          {
            prisonerNumber: 'A1234BC',
            firstName: 'TEST01',
            lastName: 'PRISONER01',
            prisonId: 'TPR',
            cellLocation: '1-1-1',
            status: 'ACTIVE IN',
          },
          {
            prisonerNumber: 'B2345CD',
            firstName: 'TEST02',
            lastName: 'PRISONER02',
            prisonId: 'TPR',
            cellLocation: '2-2-2',
            status: 'ACTIVE IN',
          },
        ] as Prisoner[])

      await handler.POST(req, res)

      expect(req.session.appointmentJourney.prisoners).toEqual([
        {
          number: 'A1234BC',
          name: 'TEST01 PRISONER01',
          cellLocation: '1-1-1',
          prisonCode: 'TPR',
          status: 'ACTIVE IN',
        },
        {
          number: 'B2345CD',
          name: 'TEST02 PRISONER02',
          cellLocation: '2-2-2',
          prisonCode: 'TPR',
          status: 'ACTIVE IN',
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('review-prisoners?preserveHistory=true')
    })

    it('should add new prisoners to session', async () => {
      req.file = {
        path: 'uploads/two-prisoners.csv',
      } as unknown as Express.Multer.File

      req.session.appointmentJourney.prisoners = [
        {
          number: 'A1234BC',
          name: 'TEST01 PRISONER01',
          cellLocation: '1-1-1',
          status: 'ACTIVE IN',
          prisonCode: 'TPR',
        },
      ]

      when(prisonerListCsvParser.getPrisonNumbers)
        .calledWith(req.file)
        .mockReturnValue(Promise.resolve(['B2345CD']))
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['B2345CD'], res.locals.user)
        .mockResolvedValue([
          {
            prisonerNumber: 'B2345CD',
            firstName: 'TEST02',
            lastName: 'PRISONER02',
            prisonId: 'TPR',
            cellLocation: '2-2-2',
            status: 'ACTIVE IN',
          },
        ] as Prisoner[])

      await handler.POST(req, res)

      expect(req.session.appointmentJourney.prisoners).toEqual([
        {
          number: 'A1234BC',
          name: 'TEST01 PRISONER01',
          cellLocation: '1-1-1',
          prisonCode: 'TPR',
          status: 'ACTIVE IN',
        },
        {
          number: 'B2345CD',
          name: 'TEST02 PRISONER02',
          cellLocation: '2-2-2',
          prisonCode: 'TPR',
          status: 'ACTIVE IN',
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('review-prisoners')
    })

    it('should save found prisoners in session and redirect to review prisoners', async () => {
      req.file = {
        path: 'uploads/two-prisoners.csv',
      } as unknown as Express.Multer.File

      req.session.appointmentJourney.prisoners = [
        {
          number: 'A1234BC',
          name: 'TEST01 PRISONER01',
          cellLocation: '1-1-1',
          status: 'ACTIVE IN',
          prisonCode: 'TPR',
        },
      ]

      when(prisonerListCsvParser.getPrisonNumbers)
        .calledWith(req.file)
        .mockReturnValue(Promise.resolve(['A1234BC', 'B2345CD']))
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['A1234BC', 'B2345CD'], res.locals.user)
        .mockResolvedValue([
          {
            prisonerNumber: 'A1234BC',
            firstName: 'TEST01',
            lastName: 'PRISONER01',
            prisonId: 'TPR',
            cellLocation: '1-1-1',
            status: 'ACTIVE IN',
          },
          {
            prisonerNumber: 'B2345CD',
            firstName: 'TEST02',
            lastName: 'PRISONER02',
            prisonId: 'TPR',
            cellLocation: '2-2-2',
            status: 'ACTIVE IN',
          },
        ] as Prisoner[])

      await handler.POST(req, res)

      expect(req.session.appointmentJourney.prisoners).toEqual([
        {
          number: 'A1234BC',
          name: 'TEST01 PRISONER01',
          cellLocation: '1-1-1',
          prisonCode: 'TPR',
          status: 'ACTIVE IN',
        },
        {
          number: 'B2345CD',
          name: 'TEST02 PRISONER02',
          cellLocation: '2-2-2',
          prisonCode: 'TPR',
          status: 'ACTIVE IN',
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('review-prisoners')
    })

    it('should only add new prisoners to session', async () => {
      req.file = {
        path: 'uploads/two-prisoners.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getPrisonNumbers)
        .calledWith(req.file)
        .mockReturnValue(Promise.resolve(['A1234BC', 'B2345CD']))
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['A1234BC', 'B2345CD'], res.locals.user)
        .mockResolvedValue([
          {
            prisonerNumber: 'A1234BC',
            firstName: 'TEST01',
            lastName: 'PRISONER01',
            prisonId: 'TPR',
            cellLocation: '1-1-1',
            status: 'ACTIVE IN',
          },
          {
            prisonerNumber: 'B2345CD',
            firstName: 'TEST02',
            lastName: 'PRISONER02',
            prisonId: 'TPR',
            cellLocation: '2-2-2',
            status: 'ACTIVE IN',
          },
        ] as Prisoner[])

      await handler.POST(req, res)

      expect(req.session.appointmentJourney.prisoners).toEqual([
        {
          number: 'A1234BC',
          name: 'TEST01 PRISONER01',
          cellLocation: '1-1-1',
          prisonCode: 'TPR',
          status: 'ACTIVE IN',
        },
        {
          number: 'B2345CD',
          name: 'TEST02 PRISONER02',
          cellLocation: '2-2-2',
          prisonCode: 'TPR',
          status: 'ACTIVE IN',
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('review-prisoners')
    })
  })

  describe('Validation', () => {
    it('validation fails when no file is uploaded', async () => {
      const body = {}

      const requestObject = plainToInstance(PrisonerList, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'file', error: 'You must select a file' }]))
    })

    it('validation fails when empty CSV file is uploaded', async () => {
      const body = {
        file: {
          path: 'uploads/empty.csv',
        },
      }

      const requestObject = plainToInstance(PrisonerList, body)

      when(fsMock.existsSync).calledWith('uploads/empty.csv').mockReturnValue(true)
      when(fsMock.lstatSync)
        .calledWith('uploads/empty.csv')
        .mockReturnValue(plainToInstance(Stats, { size: 0 }))

      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'file', error: 'The selected file is empty' }]))
    })

    it('passes validation when valid CSV file is uploaded', async () => {
      const body = {
        file: {
          path: 'uploads/valid.csv',
          mimetype: 'text/csv',
        },
      }

      const requestObject = plainToInstance(PrisonerList, body)

      when(fsMock.existsSync).calledWith('uploads/valid.csv').mockReturnValue(true)
      when(fsMock.lstatSync)
        .calledWith('uploads/valid.csv')
        .mockReturnValue(plainToInstance(Stats, { size: 1 }))

      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
