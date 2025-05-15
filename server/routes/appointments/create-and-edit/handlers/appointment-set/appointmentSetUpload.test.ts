import fs, { Stats } from 'fs'
import { Request, Response } from 'express'
import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import AppointmentSetUploadRoutes, { AppointmentsList } from './appointmentSetUpload'
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

describe('Route Handlers - Create Appointment Set - Upload', () => {
  const handler = new AppointmentSetUploadRoutes(prisonerListCsvParser, prisonService)
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
        appointmentSetJourney: {},
      },
      query: {},
      flash: jest.fn(),
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the upload appointment set view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/appointment-set/upload', {
        preserveHistory: undefined,
      })
    })

    it('should render the upload appointment set view with preserve history', async () => {
      req.query = { preserveHistory: 'true' }
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/appointment-set/upload', {
        preserveHistory: 'true',
      })
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

    it('filters out a prisoner who is not recognised as being in the active caseload', async () => {
      req.file = {
        path: 'uploads/unknown.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getAppointments)
        .calledWith(req.file)
        .mockReturnValue(
          Promise.resolve([
            {
              prisonerNumber: 'A1234BC',
              startTime: { hour: 9, minute: 0 },
              endTime: { hour: 10, minute: 0 },
            },
            {
              prisonerNumber: 'B2345CD',
              startTime: { hour: 8, minute: 30 },
              endTime: { hour: 9, minute: 30 },
            },
            {
              prisonerNumber: 'C9876DE',
              startTime: { hour: 10, minute: 0 },
              endTime: { hour: 11, minute: 0 },
            },
          ]),
        )
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['A1234BC', 'B2345CD', 'C9876DE'], res.locals.user)
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
      expect(req.session.appointmentSetJourney.appointments).toEqual([
        {
          prisoner: {
            number: 'A1234BC',
            firstName: 'TEST01',
            lastName: 'PRISONER01',
            name: 'TEST01 PRISONER01',
            cellLocation: '1-1-1',
            prisonCode: 'TPR',
            status: 'ACTIVE IN',
          },
          startTime: { hour: 9, minute: 0 },
          endTime: { hour: 10, minute: 0 },
        },
        {
          prisoner: {
            number: 'B2345CD',
            name: 'TEST02 PRISONER02',
            firstName: 'TEST02',
            lastName: 'PRISONER02',
            cellLocation: '2-2-2',
            prisonCode: 'TPR',
            status: 'ACTIVE IN',
          },
          startTime: { hour: 8, minute: 30 },
          endTime: { hour: 9, minute: 30 },
        },
      ])
      expect(req.session.appointmentSetJourney.prisonersNotFound).toEqual(['C9876DE'])
      expect(res.redirect).toHaveBeenCalledWith('review-prisoners')
    })

    it('returns empty prisoner list to the next page if CSV has unidentified prisoners', async () => {
      req.file = {
        path: 'uploads/unknown.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getAppointments)
        .calledWith(req.file)
        .mockReturnValue(
          Promise.resolve([
            {
              prisonerNumber: 'A1234BC',
              startTime: { hour: 9, minute: 30 },
              endTime: { hour: 10, minute: 30 },
            },
            {
              prisonerNumber: 'B2345CD',
              startTime: { hour: 8, minute: 30 },
              endTime: { hour: 9, minute: 30 },
            },
            {
              prisonerNumber: 'C9876DE',
              startTime: { hour: 8, minute: 30 },
              endTime: { hour: 9, minute: 30 },
            },
          ]),
        )
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['A1234BC', 'B2345CD', 'C9876DE'], res.locals.user)
        .mockResolvedValue([] as Prisoner[])

      await handler.POST(req, res)
      expect(req.session.appointmentSetJourney.appointments).toEqual([])
      expect(req.session.appointmentSetJourney.prisonersNotFound).toEqual(['A1234BC', 'B2345CD', 'C9876DE'])
      expect(res.redirect).toHaveBeenCalledWith('review-prisoners')
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
              startTime: { hour: 8, minute: 30 },
              endTime: { hour: 10, minute: 30 },
            },
            {
              prisonerNumber: 'B2345CD',
              startTime: { hour: 8, minute: 30 },
              endTime: { hour: 9, minute: 30 },
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

      expect(req.session.appointmentSetJourney.appointments).toEqual([
        {
          prisoner: {
            number: 'A1234BC',
            firstName: 'TEST01',
            lastName: 'PRISONER01',
            name: 'TEST01 PRISONER01',
            cellLocation: '1-1-1',
            prisonCode: 'TPR',
            status: 'ACTIVE IN',
          },
          startTime: { hour: 8, minute: 30 },
          endTime: { hour: 10, minute: 30 },
        },
        {
          prisoner: {
            number: 'B2345CD',
            name: 'TEST02 PRISONER02',
            firstName: 'TEST02',
            lastName: 'PRISONER02',
            cellLocation: '2-2-2',
            prisonCode: 'TPR',
            status: 'ACTIVE IN',
          },
          startTime: { hour: 8, minute: 30 },
          endTime: { hour: 9, minute: 30 },
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
              startTime: { hour: 9, minute: 30 },
              endTime: { hour: 10, minute: 30 },
            },
            {
              prisonerNumber: 'B2345CD',
              startTime: { hour: 8, minute: 30 },
              endTime: { hour: 9, minute: 30 },
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

      expect(req.session.appointmentSetJourney.appointments).toEqual([
        {
          prisoner: {
            number: 'A1234BC',
            name: 'TEST01 PRISONER01',
            firstName: 'TEST01',
            lastName: 'PRISONER01',
            cellLocation: '1-1-1',
            prisonCode: 'TPR',
            status: 'ACTIVE IN',
          },
          startTime: { hour: 9, minute: 30 },
          endTime: { hour: 10, minute: 30 },
        },
        {
          prisoner: {
            number: 'B2345CD',
            name: 'TEST02 PRISONER02',
            firstName: 'TEST02',
            lastName: 'PRISONER02',
            cellLocation: '2-2-2',
            prisonCode: 'TPR',
            status: 'ACTIVE IN',
          },
          startTime: { hour: 8, minute: 30 },
          endTime: { hour: 9, minute: 30 },
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('review-prisoners?preserveHistory=true')
    })

    it('should replace appointments in session and redirect to review prisoners page', async () => {
      req.session.appointmentSetJourney.appointments = [
        {
          prisoner: {
            number: 'XYZ1234',
            name: 'TEST03 PRISONER03',
            firstName: 'TEST03',
            lastName: 'PRISONER03',
            cellLocation: '3-3-3',
            status: 'ACTIVE IN',
            prisonCode: 'MDI',
          },
          startTime: null,
          endTime: null,
        },
        {
          prisoner: {
            number: 'D234ABC',
            name: 'TEST04 PRISONER04',
            firstName: 'TEST04',
            lastName: 'PRISONER04',
            cellLocation: '4-4-4',
            status: 'ACTIVE IN',
            prisonCode: 'MDI',
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

      expect(req.session.appointmentSetJourney.appointments).toEqual([
        {
          prisoner: {
            number: 'A1234BC',
            name: 'TEST01 PRISONER01',
            firstName: 'TEST01',
            lastName: 'PRISONER01',
            cellLocation: '1-1-1',
            prisonCode: 'TPR',
            status: 'ACTIVE IN',
          },
          startTime: null,
          endTime: null,
        },
        {
          prisoner: {
            number: 'B2345CD',
            name: 'TEST02 PRISONER02',
            firstName: 'TEST02',
            lastName: 'PRISONER02',
            cellLocation: '2-2-2',
            prisonCode: 'TPR',
            status: 'ACTIVE IN',
          },
          startTime: null,
          endTime: null,
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('review-prisoners')
    })
  })

  describe('fetchPrisonerDetails', () => {
    it('should return an empty map if the API does not recognise the PRNS', async () => {
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['A1234BC', 'B2345CD', 'C9876DE'], res.locals.user)
        .mockResolvedValue([] as Prisoner[])

      const result = await handler.fetchPrisonerDetails(['A1234BC', 'B2345CD', 'C9876DE'], res.locals.user)
      const entries = [...result.entries()]
      expect(entries).toEqual([])
    })
    it('should return an empty array map of the PRNs are within the active case load', async () => {
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['A1234BC', 'B2345CD', 'C9876DE'], res.locals.user)
        .mockResolvedValue([
          {
            prisonerNumber: 'A1234BC',
            firstName: 'TEST01',
            lastName: 'PRISONER01',
            prisonId: 'RSI',
            cellLocation: '1-1-1',
            status: 'ACTIVE IN',
          },
          {
            prisonerNumber: 'B2345CD',
            firstName: 'TEST02',
            lastName: 'PRISONER02',
            prisonId: 'RSI',
            cellLocation: '2-2-2',
            status: 'ACTIVE IN',
          },
        ] as Prisoner[])

      const result = await handler.fetchPrisonerDetails(['A1234BC', 'B2345CD', 'C9876DE'], res.locals.user)
      const entries = [...result.entries()]
      expect(entries).toEqual([])
    })
    it('should return map of prisoner numbers within the active caseload', async () => {
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['A1234BC', 'B2345CD', 'C9876DE'], res.locals.user)
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
      const result = await handler.fetchPrisonerDetails(['A1234BC', 'B2345CD', 'C9876DE'], res.locals.user)
      const entries = [...result.entries()]
      expect(entries).toEqual([
        [
          'A1234BC',
          {
            cellLocation: '1-1-1',
            firstName: 'TEST01',
            lastName: 'PRISONER01',
            prisonId: 'TPR',
            prisonerNumber: 'A1234BC',
            status: 'ACTIVE IN',
          },
        ],
        [
          'B2345CD',
          {
            cellLocation: '2-2-2',
            firstName: 'TEST02',
            lastName: 'PRISONER02',
            prisonId: 'TPR',
            prisonerNumber: 'B2345CD',
            status: 'ACTIVE IN',
          },
        ],
      ])
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
        .mockReturnValue({
          size: 0,
        } as Stats)

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
        .mockReturnValue({
          size: 1,
        } as Stats)

      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
