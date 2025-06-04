import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import config from '../../../../config'
import PrisonService from '../../../../services/prisonService'
import atLeast from '../../../../../jest.setup'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import NonAssociationsHandler from './nonAssociations'
import NonAssociationsService from '../../../../services/nonAssociationsService'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const nonAssociationsService = new NonAssociationsService(null, null) as jest.Mocked<NonAssociationsService>

const mockPrisoner: Prisoner = {
  prisonerNumber: 'ABC123',
  firstName: 'Joe',
  lastName: 'Bloggs',
  cellLocation: '1-2-001',
  prisonId: 'LEI',
  status: 'ACTIVE IN',
  lastMovementTypeCode: 'CRT',
  releaseDate: '2019-11-30',
  alerts: [{ alertType: 'R', alertCode: 'RLO', active: true, expired: false }],
} as Prisoner

describe('Route Handlers - Prisoner Allocations - Non associations', () => {
  const handler = new NonAssociationsHandler(activitiesService, prisonService, nonAssociationsService)
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

    xit('should render a prisoners non associations', async () => {
      config.prisonerAllocationsEnabled = true
      req.params.prisonerNumber = 'ABC123'
      const expectedPrisoner = {
        ...mockPrisoner,
        location: 'Court',
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
})
