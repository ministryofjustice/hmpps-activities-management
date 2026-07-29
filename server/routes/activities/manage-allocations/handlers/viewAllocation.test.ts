import { Request, Response } from 'express'
import { format, subDays } from 'date-fns'
import { when } from 'jest-when'

import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import CaseNotesService from '../../../../services/caseNotesService'
import UserService from '../../../../services/userService'

import ViewAllocationRoutes from './viewAllocation'

import { Activity, Allocation, ExclusionRevision } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { CaseNote } from '../../../../@types/caseNotesApi/types'
import { UserDetails } from '../../../../@types/manageUsersApiImport/types'

import activitySchedule from '../../../../services/fixtures/activity_schedule_1.json'
import atLeast from '../../../../../jest.setup'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/caseNotesService')
jest.mock('../../../../services/userService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const caseNotesService = new CaseNotesService(null) as jest.Mocked<CaseNotesService>
const userService = new UserService(null) as jest.Mocked<UserService>

describe('ViewAllocationRoutes', () => {
  const handler = new ViewAllocationRoutes(activitiesService, prisonService, caseNotesService, userService)

  let req: Request
  let res: Response

  const user = {
    username: 'joebloggs',
    activeCaseLoad: {
      caseLoadId: 'MDI',
    },
  }

  const prisoner: Prisoner = {
    prisonerNumber: 'G4793VF',
    firstName: 'John',
    lastName: 'Smith',
    currentIncentive: {
      level: {
        description: 'Standard',
      },
    },
  } as Prisoner

  const exclusionHistory: ExclusionRevision[] = [
    {
      weekNumber: 1,
      timeSlots: ['AM'],
      dayOfWeek: 'MONDAY',
      revisionType: 'ADDED',
      revision: 1,
      updatedBy: 'OLDER_USER',
      updatedDateTime: '2024-05-06T09:15:00',
    },
    {
      weekNumber: 1,
      timeSlots: ['PM'],
      dayOfWeek: 'TUESDAY',
      revisionType: 'REMOVED',
      revision: 2,
      updatedBy: 'LATEST_USER',
      updatedDateTime: '2024-05-09T10:30:00',
    },
    {
      weekNumber: 2,
      timeSlots: ['AM'],
      dayOfWeek: 'WEDNESDAY',
      revisionType: 'ADDED',
      revision: 2,
      updatedBy: 'LATEST_USER',
      updatedDateTime: '2024-05-09T10:30:00',
    },
  ]

  beforeEach(() => {
    req = {
      params: {
        allocationId: '1',
      },
    } as unknown as Request

    res = {
      locals: { user },
      render: jest.fn(),
    } as unknown as Response

    when(prisonService.getInmateByPrisonerNumber).calledWith('G4793VF', user).mockResolvedValue(prisoner)

    when(activitiesService.getActivity)
      .calledWith(atLeast(1))
      .mockResolvedValue({
        id: 1,
        category: { code: 'EDUCATION', id: 1, name: 'Education' },
        paid: true,
        pay: [
          {
            incentiveLevel: 'Standard',
            prisonPayBand: { id: 1, alias: 'Low' },
            rate: 100,
          },
          {
            incentiveLevel: 'Standard',
            prisonPayBand: { id: 1, alias: 'Low' },
            rate: 200,
          },
          {
            incentiveLevel: 'Standard',
            prisonPayBand: { id: 1, alias: 'Low' },
            rate: 300,
            startDate: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
          },
        ],
        schedules: [activitySchedule],
        startDate: '2022-01-01',
      } as unknown as Activity)

    when(caseNotesService.getCaseNote)
      .calledWith(atLeast('G4793VF'))
      .mockResolvedValue({
        text: 'test case note',
      } as CaseNote)
  })

  afterEach(() => jest.resetAllMocks())

  const mockAllocation = (overrides: Partial<Allocation> = {}) => {
    when(activitiesService.getAllocation)
      .calledWith(1, user)
      .mockResolvedValue({
        id: 1,
        activityId: 1,
        prisonerNumber: 'G4793VF',
        startDate: '2022-05-19',
        prisonPayBand: { id: 1 },
        exclusions: [],
        allocatedBy: 'GEOFFT',
        allocatedTime: '2024-05-03T13:22:00',
        plannedSuspension: {
          plannedBy: 'joebloggs',
          dpsCaseNoteId: 'note-id',
        },
        ...overrides,
      } as Allocation)
  }

  const mockUserMap = (usernames: string[]) => {
    when(userService.getUserMap)
      .calledWith(atLeast(usernames))
      .mockResolvedValue(
        new Map(
          usernames.map(username => [
            username,
            {
              username,
              name: username,
            } as UserDetails,
          ]),
        ),
      )
  }

  describe('GET', () => {
    it('should render multiple latest exclusion changes that were Added and Removed', async () => {
      mockAllocation()

      when(activitiesService.getAllocationExclusionsHistory).calledWith(1, user).mockResolvedValue(exclusionHistory)

      mockUserMap(['joebloggs', 'LATEST_USER'])
      mockUserMap(['GEOFFT'])

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/view-allocation',
        expect.objectContaining({
          updatedBy: 'LATEST_USER',
          latestUpdatedDateTime: '2024-05-09T10:30:00',
          addedPrisonerExclusionHistory: [exclusionHistory[2]],
          removedPrisonerExclusionHistory: [exclusionHistory[1]],
          exclusionHistory,
        }),
      )
    })

    it('should handle allocated by user not found', async () => {
      mockAllocation({
        allocatedBy: 'MIGRATION',
      })

      when(activitiesService.getAllocationExclusionsHistory).calledWith(1, user).mockResolvedValue(exclusionHistory)

      mockUserMap(['joebloggs', 'LATEST_USER'])

      when(userService.getUserMap)
        .calledWith(atLeast(['MIGRATION']))
        .mockRejectedValue(new Error('User not found'))

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/view-allocation',
        expect.objectContaining({
          updatedBy: 'LATEST_USER',
          latestUpdatedDateTime: '2024-05-09T10:30:00',
          addedPrisonerExclusionHistory: [exclusionHistory[2]],
          removedPrisonerExclusionHistory: [exclusionHistory[1]],
          exclusionHistory,
        }),
      )
    })

    it('should return empty exclusion changes when no history exists after allocation', async () => {
      mockAllocation({
        allocatedTime: '2024-06-01T00:00:00',
      })

      when(activitiesService.getAllocationExclusionsHistory).calledWith(1, user).mockResolvedValue(exclusionHistory)

      mockUserMap(['joebloggs'])

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/view-allocation',
        expect.objectContaining({
          latestUpdatedDateTime: undefined,
          addedPrisonerExclusionHistory: [],
          removedPrisonerExclusionHistory: [],
          exclusionHistory,
        }),
      )
    })

    it('should set isOnlyPay to false when multiple current pay bands exist', async () => {
      mockAllocation()

      when(activitiesService.getAllocationExclusionsHistory).calledWith(1, user).mockResolvedValue([])

      mockUserMap(['joebloggs'])
      mockUserMap(['GEOFFT'])

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/view-allocation',
        expect.objectContaining({
          isOnlyPay: false,
        }),
      )
    })
  })
})
