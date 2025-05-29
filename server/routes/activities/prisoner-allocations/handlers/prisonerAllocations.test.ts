import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonerAllocationsHandler from './prisonerAllocations'
import config from '../../../../config'
import PrisonService from '../../../../services/prisonService'
import atLeast from '../../../../../jest.setup'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

const mockPrisoner: Prisoner = {
  prisonerNumber: 'ABC123',
  firstName: 'Joe',
  lastName: 'Bloggs',
  cellLocation: '1-2-001',
  prisonId: 'LEI',
  status: 'ACTIVE IN',
  releaseDate: '2019-11-30',
  alerts: [{ alertType: 'R', alertCode: 'RLO', active: true, expired: false }],
} as Prisoner

describe('Route Handlers - Prisoner Allocations', () => {
  const handler = new PrisonerAllocationsHandler(activitiesService, prisonService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      params: { prisonerNumber: '12345' },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should redirect if feature toggle disabled', async () => {
      config.prisonerAllocationsEnabled = false
      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('/activities')
    })

    it('should render a prisoners allocation details', async () => {
      config.prisonerAllocationsEnabled = true
      req.params.prisonerNumber = 'ABC123'
      const expectedPrisoner = {
        ...mockPrisoner,
        earliestReleaseDate: '2019-11-30',
        workplaceRiskAssessment: 'LOW',
      }
      when(prisonService.getInmateByPrisonerNumber).calledWith(atLeast('ABC123')).mockResolvedValue(mockPrisoner)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/prisoner-allocations/dashboard', {
        prisoner: expectedPrisoner,
      })
    })
  })

  describe('POST', () => {
    it('should redirect to another page', async () => {
      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('/activities/prisoner-allocations')
    })
  })
})
