import fs, { Stats } from 'fs'
import { Request, Response } from 'express'
import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import UploadBulkAppointment, { AppointmentsList } from './uploadBulkAppointment'
import PrisonerListCsvParser from '../../../../../utils/prisonerListCsvParser'
import PrisonService from '../../../../../services/prisonService'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'
import { associateErrorsWithProperty } from '../../../../../utils/utils'

jest.mock('fs')
jest.mock('isbinaryfile', () => ({
  isBinaryFileSync: jest.fn(file => file === 'uploads/non-csv.csv'),
}))
jest.mock('../../../../../utils/prisonerListCsvParser')
jest.mock('../../../../../services/prisonService')

const fsMock: jest.Mocked<typeof fs> = <jest.Mocked<typeof fs>>fs
const prisonerListCsvParser = new PrisonerListCsvParser() as jest.Mocked<PrisonerListCsvParser>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Create Bulk Appointment - Upload Bulk Appointment', () => {
  const handler = new UploadBulkAppointment(prisonerListCsvParser, prisonService)
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
      addValidationError: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        appointmentJourney: {},
        bulkAppointmentJourney: {},
      },
      query: {},
      flash: jest.fn(),
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the upload bulk appointment view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/appointments/create-and-edit/bulk-appointments/upload-bulk-appointment',
        { preserveHistory: undefined },
      )
    })

    it('should render the upload bulk appointment view with preserve history', async () => {
      req.query = { preserveHistory: 'true' }
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/appointments/create-and-edit/bulk-appointments/upload-bulk-appointment',
        { preserveHistory: 'true' },
      )
    })
  })

  describe('POST', () => {
    it('validation fails when uploaded file does not contain any appointments', async () => {
      req.file = {
        path: 'uploads/no-appointments.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getAppointments).calledWith(req.file).mockReturnValue(Promise.resolve([]))

      await handler.POST(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith('file', 'The selected file does not contain any prison numbers')
    })

    it('validation fails when single prisoner not found', async () => {
      req.file = {
        path: 'uploads/unknown.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getAppointments)
        .calledWith(req.file)
        .mockReturnValue(
          Promise.resolve([
            {
              prisonerNumber: 'A1234BC',
              startTime: null,
              endTime: null,
            },
          ]),
        )
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['A1234BC'], res.locals.user)
        .mockResolvedValue([] as Prisoner[])

      await handler.POST(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith('file', 'Prisoner with number A1234BC was not found')
    })

    it('validation fails when two prisoners not found', async () => {
      req.file = {
        path: 'uploads/unknown.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getAppointments)
        .calledWith(req.file)
        .mockReturnValue(
          Promise.resolve([
            {
              prisonerNumber: 'A1234BC',
              startTime: null,
              endTime: null,
            },
            {
              prisonerNumber: 'B2345CD',
              startTime: null,
              endTime: null,
            },
          ]),
        )
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['A1234BC', 'B2345CD'], res.locals.user)
        .mockResolvedValue([] as Prisoner[])

      await handler.POST(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith(
        'file',
        'Prisoners with numbers A1234BC, B2345CD were not found',
      )
    })

    it('should save appointments to session and redirect to review prisoners page', async () => {
      req.file = {
        path: 'uploads/two-prisoners.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getAppointments)
        .calledWith(req.file)
        .mockReturnValue(
          Promise.resolve([
            {
              prisonerNumber: 'A1234BC',
              startTime: null,
              endTime: null,
            },
            {
              prisonerNumber: 'B2345CD',
              startTime: null,
              endTime: null,
            },
          ]),
        )
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
            prisonId: 'TPR',
            cellLocation: '2-2-2',
          },
        ] as Prisoner[])

      await handler.POST(req, res)

      expect(req.session.bulkAppointmentJourney.appointments).toEqual([
        {
          prisoner: {
            number: 'A1234BC',
            name: 'TEST01 PRISONER01',
            cellLocation: '1-1-1',
          },
          startTime: null,
          endTime: null,
        },
        {
          prisoner: {
            number: 'B2345CD',
            name: 'TEST02 PRISONER02',
            cellLocation: '2-2-2',
          },
          startTime: null,
          endTime: null,
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('review-prisoners')
    })

    it('should save appointments to session and redirect to review prisoners page with preserve history', async () => {
      req.query = { preserveHistory: 'true' }
      req.file = {
        path: 'uploads/two-prisoners.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getAppointments)
        .calledWith(req.file)
        .mockReturnValue(
          Promise.resolve([
            {
              prisonerNumber: 'A1234BC',
              startTime: null,
              endTime: null,
            },
            {
              prisonerNumber: 'B2345CD',
              startTime: null,
              endTime: null,
            },
          ]),
        )
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
            prisonId: 'TPR',
            cellLocation: '2-2-2',
          },
        ] as Prisoner[])

      await handler.POST(req, res)

      expect(req.session.bulkAppointmentJourney.appointments).toEqual([
        {
          prisoner: {
            number: 'A1234BC',
            name: 'TEST01 PRISONER01',
            cellLocation: '1-1-1',
          },
          startTime: null,
          endTime: null,
        },
        {
          prisoner: {
            number: 'B2345CD',
            name: 'TEST02 PRISONER02',
            cellLocation: '2-2-2',
          },
          startTime: null,
          endTime: null,
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('review-prisoners?preserveHistory=true')
    })

    it('should replace appointments in session and redirect to review prisoners page', async () => {
      req.session.bulkAppointmentJourney.appointments = [
        {
          prisoner: {
            number: 'XYZ1234',
            name: 'TEST03 PRISONER03',
            cellLocation: '3-3-3',
          },
          startTime: null,
          endTime: null,
        },
        {
          prisoner: {
            number: 'D234ABC',
            name: 'TEST04 PRISONER04',
            cellLocation: '4-4-4',
          },
          startTime: null,
          endTime: null,
        },
      ]
      req.file = {
        path: 'uploads/two-prisoners.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getAppointments)
        .calledWith(req.file)
        .mockReturnValue(
          Promise.resolve([
            {
              prisonerNumber: 'A1234BC',
              startTime: null,
              endTime: null,
            },
            {
              prisonerNumber: 'B2345CD',
              startTime: null,
              endTime: null,
            },
          ]),
        )
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
            prisonId: 'TPR',
            cellLocation: '2-2-2',
          },
        ] as Prisoner[])

      await handler.POST(req, res)

      expect(req.session.bulkAppointmentJourney.appointments).toEqual([
        {
          prisoner: {
            number: 'A1234BC',
            name: 'TEST01 PRISONER01',
            cellLocation: '1-1-1',
          },
          startTime: null,
          endTime: null,
        },
        {
          prisoner: {
            number: 'B2345CD',
            name: 'TEST02 PRISONER02',
            cellLocation: '2-2-2',
          },
          startTime: null,
          endTime: null,
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('review-prisoners')
    })
  })

  describe('Validation', () => {
    it('validation fails when no file is uploaded', async () => {
      const body = {}

      const requestObject = plainToInstance(AppointmentsList, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'file', error: 'You must select a file' }]))
    })

    it('validation fails when empty CSV file is uploaded', async () => {
      const body = {
        file: {
          path: 'uploads/empty.csv',
        },
      }

      const requestObject = plainToInstance(AppointmentsList, body)

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

      const requestObject = plainToInstance(AppointmentsList, body)

      when(fsMock.existsSync).calledWith('uploads/valid.csv').mockReturnValue(true)
      when(fsMock.lstatSync)
        .calledWith('uploads/valid.csv')
        .mockReturnValue(plainToInstance(Stats, { size: 1 }))

      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
