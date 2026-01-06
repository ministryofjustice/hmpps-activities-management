import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import atLeast from '../../../../../jest.setup'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import NonAssociationsHandler from './nonAssociations'
import NonAssociationsService from '../../../../services/nonAssociationsService'
import { Activity, ActivitySchedule, PrisonerAllocations } from '../../../../@types/activitiesAPI/types'
import { PrisonerNonAssociations } from '../../../../@types/nonAssociationsApi/types'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/nonAssociationsService')

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

const mockOtherPrisonerDetails = {
  prisonerNumber: 'G6512VC',
  firstName: 'John',
  lastName: 'Smith',
  cellLocation: '1-2-002',
}

const mockNonAssociation = {
  id: 51510,
  role: 'NOT_RELEVANT',
  reason: 'GANG_RELATED',
  restrictionType: 'WING',
  restrictionTypeDescription: 'Cell, landing and wing',
  otherPrisonerDetails: mockOtherPrisonerDetails,
  isOpen: true,
}

const mockNonAssociations = {
  prisonerNumber: 'ABC123',
  nonAssociations: [mockNonAssociation],
} as unknown as PrisonerNonAssociations

const naAllocations = [
  {
    prisonerNumber: 'G6512VC',
    allocations: [
      {
        activitySummary: 'Barbering A',
        activityId: 858,
        scheduleId: 837,
      },
    ],
  },
] as unknown as PrisonerAllocations[]

const activitySchedule = {
  id: 1,
  description: '',
  internalLocation: {
    id: 1,
    code: 'EDU-ROOM-1',
    description: 'Education - R1',
  },
  capacity: 10,
  activity: {
    id: 858,
    prisonCode: 'MDI',
    attendanceRequired: true,
    inCell: false,
    onWing: false,
    offWing: false,
  },
} as unknown as ActivitySchedule

const mockActivity = {
  schedules: [activitySchedule],
  id: 858,
} as unknown as Activity

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
    it('should render a prisoners non associations', async () => {
      req.params.prisonerNumber = 'ABC123'
      const expectedPrisoner = {
        ...mockPrisoner,
        enhancedNonAssociations: [
          {
            allocations: [
              {
                activitySummary: 'Barbering A',
                scheduleId: 837,
                activityId: 858,
                schedule: activitySchedule,
              },
            ],
            ...mockNonAssociation,
            otherPrisonerDetails: mockOtherPrisonerDetails,
          },
        ],
      }

      when(prisonService.getInmateByPrisonerNumber).calledWith(atLeast('ABC123')).mockResolvedValue(mockPrisoner)
      when(nonAssociationsService.getNonAssociationByPrisonerId)
        .calledWith(atLeast('ABC123'))
        .mockResolvedValue(mockNonAssociations)
      when(activitiesService.getActivity).calledWith(atLeast(858)).mockResolvedValue(mockActivity)
      when(activitiesService.getActivePrisonPrisonerAllocations).mockResolvedValue(naAllocations)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/prisoner-allocations/non-associations', {
        prisoner: expectedPrisoner,
      })
    })
  })
})
