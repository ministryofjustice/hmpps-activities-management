import { Request, Response } from 'express'
import { when } from 'jest-when'
import fs, { Stats } from 'fs'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import UploadPrisonerListRoutes, { UploadPrisonerList } from './uploadPrisonerList'
import PrisonService from '../../../../../services/prisonService'
import PrisonerListCsvParser from '../../../../../utils/prisonerListCsvParser'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import { Inmate } from '../../journey'
import ActivitiesService from '../../../../../services/activitiesService'
import { Allocation, PrisonerAllocations } from '../../../../../@types/activitiesAPI/types'
import NonAssociationsService from '../../../../../services/nonAssociationsService'

jest.mock('fs')
jest.mock('isbinaryfile', () => ({
  isBinaryFileSync: jest.fn(file => file === 'uploads/non-csv.csv'),
}))
const fsMock: jest.Mocked<typeof fs> = <jest.Mocked<typeof fs>>fs
jest.mock('../../../../../utils/prisonerListCsvParser')
jest.mock('../../../../../services/prisonService')
jest.mock('../../../../../services/activitiesService')
jest.mock('../../../../../services/nonAssociationsService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const prisonerListCsvParser = new PrisonerListCsvParser() as jest.Mocked<PrisonerListCsvParser>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const nonAssociationsService = new NonAssociationsService(null, null) as jest.Mocked<NonAssociationsService>

const prisonerA: Prisoner = {
  dateOfBirth: '',
  ethnicity: '',
  firstName: 'TEST01',
  gender: '',
  lastName: 'PRISONER01',
  maritalStatus: '',
  mostSeriousOffence: '',
  nationality: '',
  prisonerNumber: 'A1234BC',
  religion: '',
  restrictedPatient: false,
  status: 'ACTIVE IN',
  youthOffender: false,
  prisonId: 'TPR',
  cellLocation: '1-1-1',
  currentIncentive: {
    level: {
      description: 'Standard',
    },
    dateTime: '2022-11-10T15:47:24',
    nextReviewDate: '2022-11-10',
  },
}

const prisonerB: Prisoner = {
  dateOfBirth: '',
  ethnicity: '',
  firstName: 'TEST02',
  gender: '',
  lastName: 'PRISONER02',
  maritalStatus: '',
  mostSeriousOffence: '',
  nationality: '',
  prisonerNumber: 'B2345CD',
  religion: '',
  restrictedPatient: false,
  status: 'ACTIVE IN',
  youthOffender: false,
  prisonId: 'TPR',
  cellLocation: '2-2-2',
  currentIncentive: {
    level: {
      description: 'Basic',
    },
    dateTime: '2022-11-10T15:47:24',
    nextReviewDate: '2022-11-10',
  },
}

const allocation: Allocation = {
  activityId: 22,
  activitySummary: 'other',
  bookingId: 0,
  exclusions: [],
  id: 0,
  isUnemployment: false,
  prisonerNumber: 'A1234BC',
  scheduleDescription: '',
  scheduleId: 22,
  startDate: '2024-01-01',
  status: undefined,
}

const prisonerAllocations1: PrisonerAllocations = {
  allocations: [allocation],
  prisonerNumber: 'A1234BC',
}

const prisonerAllocations2: PrisonerAllocations = {
  allocations: [],
  prisonerNumber: 'B2345CD',
}

const prisonersResult = [
  { prisonerNumber: 'A1234BC', firstName: 'Daphne', lastName: 'Doe', cellLocation: '1-1-1' },
  { prisonerNumber: 'B2345CD', firstName: 'Ted', lastName: 'Daphneson', cellLocation: '2-2-2' },
] as Prisoner[]

describe('Allocate multiple people to an activity - upload a prisoner list', () => {
  const handler = new UploadPrisonerListRoutes(
    prisonerListCsvParser,
    prisonService,
    activitiesService,
    nonAssociationsService,
  )
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
        allocateJourney: {
          inmates: [],
          activity: {
            scheduleId: 1,
          },
        },
      },
      query: {},
    } as unknown as Request
  })
  describe('GET', () => {
    it('should render the upload a prisoner list view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/allocateMultiplePeople/uploadPrisonerList',
      )
    })
  })

  describe('POST', () => {
    it('should redirect to review upload a prisoner list view', async () => {
      req.file = {
        path: 'uploads/two-prisoners.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getPrisonNumbers)
        .calledWith(req.file)
        .mockReturnValue(Promise.resolve(['A1234BC', 'B2345CD']))

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['A1234BC', 'B2345CD'], res.locals.user)
        .mockResolvedValue([prisonerA, prisonerB])

      when(prisonService.searchPrisonInmates)
        .calledWith('', res.locals.user)
        .mockResolvedValue({ content: prisonersResult })

      when(activitiesService.getActivePrisonPrisonerAllocations)
        .calledWith(['A1234BC', 'B2345CD'], res.locals.user)
        .mockResolvedValue([prisonerAllocations1, prisonerAllocations2])

      when(nonAssociationsService.getListPrisonersWithNonAssociations)
        .calledWith(['A1234BC', 'B2345CD'], res.locals.user)
        .mockResolvedValue(['A1234BC'])

      await handler.POST(req, res)

      const expectedInmates: Inmate[] = [
        {
          prisonerName: 'TEST01 PRISONER01',
          firstName: 'TEST01',
          lastName: 'PRISONER01',
          prisonerNumber: 'A1234BC',
          prisonCode: 'TPR',
          status: 'ACTIVE IN',
          cellLocation: '1-1-1',
          incentiveLevel: 'Standard',
          payBand: undefined,
          otherAllocations: [
            {
              activityId: 22,
              activitySummary: 'other',
              bookingId: 0,
              exclusions: [],
              id: 0,
              isUnemployment: false,
              prisonerNumber: 'A1234BC',
              scheduleDescription: '',
              scheduleId: 22,
              startDate: '2024-01-01',
              status: undefined,
            },
          ],
          nonAssociations: true,
        },
        {
          prisonerName: 'TEST02 PRISONER02',
          firstName: 'TEST02',
          lastName: 'PRISONER02',
          prisonerNumber: 'B2345CD',
          prisonCode: 'TPR',
          status: 'ACTIVE IN',
          cellLocation: '2-2-2',
          incentiveLevel: 'Basic',
          payBand: undefined,
          otherAllocations: [],
          nonAssociations: false,
        },
      ]

      expect(req.session.allocateJourney.inmates).toEqual(expectedInmates)
      expect(res.redirect).toHaveBeenCalledWith('review-upload-prisoner-list?csv=true')
    })

    it('should pass not found prisoner and redirect to review upload a prisoner list view', async () => {
      req.file = {
        path: 'uploads/three-prisoners.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getPrisonNumbers)
        .calledWith(req.file)
        .mockReturnValue(Promise.resolve(['A1234BC', 'B2345CD', 'A12gvv34BC']))

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['A1234BC', 'B2345CD', 'A12gvv34BC'], res.locals.user)
        .mockResolvedValue([prisonerA, prisonerB])

      when(prisonService.searchPrisonInmates)
        .calledWith('', res.locals.user)
        .mockResolvedValue({ content: prisonersResult })

      when(activitiesService.getActivePrisonPrisonerAllocations)
        .calledWith(['A1234BC', 'B2345CD'], res.locals.user)
        .mockResolvedValue([prisonerAllocations1, prisonerAllocations2])

      when(nonAssociationsService.getListPrisonersWithNonAssociations)
        .calledWith(['A1234BC', 'B2345CD'], res.locals.user)
        .mockResolvedValue(['A1234BC'])

      await handler.POST(req, res)

      const expectedInmates: Inmate[] = [
        {
          prisonerName: 'TEST01 PRISONER01',
          firstName: 'TEST01',
          lastName: 'PRISONER01',
          prisonerNumber: 'A1234BC',
          prisonCode: 'TPR',
          status: 'ACTIVE IN',
          cellLocation: '1-1-1',
          incentiveLevel: 'Standard',
          payBand: undefined,
          otherAllocations: [
            {
              activityId: 22,
              activitySummary: 'other',
              bookingId: 0,
              exclusions: [],
              id: 0,
              isUnemployment: false,
              prisonerNumber: 'A1234BC',
              scheduleDescription: '',
              scheduleId: 22,
              startDate: '2024-01-01',
              status: undefined,
            },
          ],
          nonAssociations: true,
        },
        {
          prisonerName: 'TEST02 PRISONER02',
          firstName: 'TEST02',
          lastName: 'PRISONER02',
          prisonerNumber: 'B2345CD',
          prisonCode: 'TPR',
          status: 'ACTIVE IN',
          cellLocation: '2-2-2',
          incentiveLevel: 'Basic',
          payBand: undefined,
          otherAllocations: [],
          nonAssociations: false,
        },
      ]
      expect(req.session.allocateJourney.notFoundPrisoners).toEqual(['A12gvv34BC'])
      expect(req.session.allocateJourney.unidentifiable).toEqual(false)
      expect(req.session.allocateJourney.inmates).toEqual(expectedInmates)
      expect(res.redirect).toHaveBeenCalledWith('review-upload-prisoner-list?csv=true')
    })

    it('should pass unidentifiable trigger when all uploaded prison numbers are incorrect', async () => {
      req.file = {
        path: 'uploads/two-prisoners.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getPrisonNumbers)
        .calledWith(req.file)
        .mockReturnValue(Promise.resolve(['A12gvv34BC', 'Bgvv2345CD']))

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['A12gvv34BC', 'Bgvv2345CD'], res.locals.user)
        .mockResolvedValue([])

      await handler.POST(req, res)

      expect(req.session.allocateJourney.unidentifiable).toEqual(true)
      expect(req.session.allocateJourney.inmates).toEqual([])
      expect(res.redirect).toHaveBeenCalledWith('review-upload-prisoner-list')
    })
  })

  describe('Validation', () => {
    it('validation fails when uploaded file does not contain any appointments', async () => {
      req.file = {
        path: 'uploads/no-appointments.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getPrisonNumbers).calledWith(req.file).mockReturnValue(Promise.resolve([]))

      await handler.POST(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith('file', 'The selected file does not contain any prison numbers')
    })

    it('validation fails when no file is uploaded', async () => {
      const body = {}

      const requestObject = plainToInstance(UploadPrisonerList, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'file', error: 'You must select a file' }]))
    })

    it('validation fails when empty CSV file is uploaded', async () => {
      const body = {
        file: {
          path: 'uploads/empty.csv',
        },
      }

      const requestObject = plainToInstance(UploadPrisonerList, body)

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

      const requestObject = plainToInstance(UploadPrisonerList, body)

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
