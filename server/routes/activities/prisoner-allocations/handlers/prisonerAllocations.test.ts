import { Request, Response } from 'express'
import { when } from 'jest-when'
import PrisonService from '../../../../services/prisonService'
import NonAssociationsService from '../../../../services/nonAssociationsService'
import PrisonerAllocationsHandler from './prisonerAllocations'
import config from '../../../../config'
import atLeast from '../../../../../jest.setup'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { PrisonerNonAssociations } from '../../../../@types/nonAssociationsApi/types'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/nonAssociationsService')

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

const mockNonAssociations = {
  nonAssociations: [],
} as PrisonerNonAssociations

describe('Route Handlers - Prisoner Allocations', () => {
  const handler = new PrisonerAllocationsHandler(prisonService, nonAssociationsService)
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

      when(prisonService.getInmateByPrisonerNumber).calledWith(atLeast('ABC123')).mockResolvedValue(mockPrisoner)
      when(nonAssociationsService.getNonAssociationByPrisonerId)
        .calledWith(atLeast('ABC123'))
        .mockResolvedValue(mockNonAssociations)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/prisoner-allocations/dashboard', {
        prisoner: mockPrisoner,
        hasNonAssociations: false,
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
