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

jest.mock('fs')
jest.mock('isbinaryfile', () => ({
  isBinaryFileSync: jest.fn(file => file === 'uploads/non-csv.csv'),
}))
const fsMock: jest.Mocked<typeof fs> = <jest.Mocked<typeof fs>>fs
jest.mock('../../../../../utils/prisonerListCsvParser')
jest.mock('../../../../../services/prisonService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const prisonerListCsvParser = new PrisonerListCsvParser() as jest.Mocked<PrisonerListCsvParser>

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

describe('Allocate multiple people to an activity - upload a prisoner list', () => {
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
        allocateJourney: {
          inmates: [],
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
        },
      ]

      expect(req.session.allocateJourney.inmates).toEqual(expectedInmates)
      expect(res.redirect).toHaveBeenCalledWith('review-upload-prisoner-list')
    })

    it('should fail to validate if a prisoner number is not in the prison', async () => {
      req.file = {
        path: 'uploads/two-prisoners.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getPrisonNumbers)
        .calledWith(req.file)
        .mockReturnValue(Promise.resolve(['A1234BC', 'B2345CD']))

      // only one returned
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['A1234BC', 'B2345CD'], res.locals.user)
        .mockResolvedValue([prisonerA])

      await handler.POST(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith(
        'file',
        'The following prison number does not match anyone in this prison: B2345CD',
      )
    })

    it('should fail to validate if two prisoner numbers are not in the prison', async () => {
      req.file = {
        path: 'uploads/two-prisoners.csv',
      } as unknown as Express.Multer.File

      when(prisonerListCsvParser.getPrisonNumbers)
        .calledWith(req.file)
        .mockReturnValue(Promise.resolve(['A1234BC', 'B2345CD']))

      // no prisoners returned
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['A1234BC', 'B2345CD'], res.locals.user)
        .mockResolvedValue([])

      await handler.POST(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith(
        'file',
        'The following prison numbers do not match anyone in this prison: A1234BC, B2345CD',
      )
    })
  })

  describe('Validation', () => {
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
