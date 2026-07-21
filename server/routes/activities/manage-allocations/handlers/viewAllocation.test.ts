import { Request, Response } from 'express'
import { format, subDays } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { Activity, Allocation, ExclusionRevision } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import ViewAllocationRoutes from './viewAllocation'
import activitySchedule from '../../../../services/fixtures/activity_schedule_1.json'
import CaseNotesService from '../../../../services/caseNotesService'
import UserService from '../../../../services/userService'
import { UserDetails } from '../../../../@types/manageUsersApiImport/types'
import { CaseNote } from '../../../../@types/caseNotesApi/types'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/caseNotesService')
jest.mock('../../../../services/userService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const caseNotesService = new CaseNotesService(null) as jest.Mocked<CaseNotesService>
const userService = new UserService(null) as jest.Mocked<UserService>

const payStartDate = format(subDays(new Date(), 2), 'yyyy-MM-dd')

const prisonerInfo = {
  prisonerNumber: 'G4793VF',
  firstName: 'John',
  lastName: 'Smith',
  cellLocation: '1-1-1',
  currentIncentive: {
    level: {
      description: 'Standard',
    },
  },
} as Prisoner

const defaultAllocation = {
  id: 1,
  activityId: 1,
  scheduleId: activitySchedule.id,
  prisonerNumber: 'G4793VF',
  startDate: '2022-05-19',
  prisonPayBand: {
    id: 1,
  },
  exclusions: [
    {
      weekNumber: 1,
      timeSlot: 'AM',
      monday: true,
      daysOfWeek: ['MONDAY'],
    },
  ],
  plannedSuspension: {
    plannedBy: 'joebloggs',
    caseNoteId: 10001,
    dpsCaseNoteId: 'fe8eaa76-a7b1-4479-a0fc-cab287edda29',
  },
  allocatedBy: 'GEOFFT',
  allocatedTime: '2024-05-03T13:22:00',
} as Allocation

const defaultActivity = {
  attendanceRequired: false,
  category: {
    code: 'EDUCATION',
    id: 1,
    name: 'Education',
  },
  createdBy: '',
  createdTime: '',
  description: '',
  eligibilityRules: [],
  endDate: '2022-12-31',
  inCell: false,
  outsideWork: false,
  paid: true,
  pay: [
    {
      incentiveLevel: 'Standard',
      prisonPayBand: {
        id: 1,
        alias: 'Low',
      },
      rate: 100,
    },
    {
      incentiveLevel: 'Standard',
      prisonPayBand: {
        id: 1,
        alias: 'Low',
      },
      rate: 97,
      startDate: payStartDate,
    },
  ],
  payPerSession: 'H',
  pieceWork: false,
  prisonCode: '',
  riskLevel: '',
  schedules: [
    {
      ...activitySchedule,
      updatedTime: '2024-05-02T12:00:00',
      updatedBy: 'SCHEDULE_USER',
    },
  ],
  startDate: '2022-01-01',
  summary: 'Maths Level 1',
  tier: {
    code: '',
    description: '',
    id: 0,
  },
  waitingList: [],
  id: 1,
  minimumEducationLevel: [],
} as unknown as Activity

const expectedPay = {
  incentiveLevel: 'Standard',
  prisonPayBand: {
    id: 1,
    alias: 'Low',
  },
  rate: 97,
  startDate: payStartDate,
}

const expectedDailySlots = {
  '1': [
    {
      day: 'Monday',
      slots: [],
    },
    {
      day: 'Tuesday',
      slots: [
        {
          timeSlot: 'AM',
          startTime: '10:00',
          endTime: '11:00',
        },
      ],
    },
    {
      day: 'Wednesday',
      slots: [
        {
          timeSlot: 'AM',
          startTime: '10:00',
          endTime: '11:00',
        },
      ],
    },
    {
      day: 'Thursday',
      slots: [
        {
          timeSlot: 'AM',
          startTime: '11:00',
          endTime: '12:00',
        },
      ],
    },
    {
      day: 'Friday',
      slots: [
        {
          timeSlot: 'AM',
          startTime: '11:00',
          endTime: '12:00',
        },
      ],
    },
    {
      day: 'Saturday',
      slots: [
        {
          timeSlot: 'AM',
          startTime: '11:00',
          endTime: '12:00',
        },
      ],
    },
    {
      day: 'Sunday',
      slots: [
        {
          timeSlot: 'AM',
          startTime: '11:00',
          endTime: '12:00',
        },
      ],
    },
  ],
}

const joeBloggsUserMap = new Map([
  [
    'joebloggs',
    {
      username: 'joebloggs',
      name: 'Joe Bloggs',
    },
  ],
]) as unknown as Map<string, UserDetails>

const geoffTomsUserMap = new Map([
  [
    'GEOFFT',
    {
      username: 'GEOFFT',
      name: 'Geoff Toms',
    },
  ],
]) as unknown as Map<string, UserDetails>

describe('Route Handlers - Allocation dashboard', () => {
  const handler = new ViewAllocationRoutes(activitiesService, prisonService, caseNotesService, userService)

  let req: Request
  let res: Response

  const user = {
    username: 'joebloggs',
    activeCaseLoad: {
      caseLoadId: 'MDI',
    },
  }

  beforeEach(() => {
    res = {
      locals: {
        user,
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      params: {
        allocationId: 1,
      },
    } as unknown as Request

    prisonService.getInmateByPrisonerNumber.mockResolvedValue(prisonerInfo)
    activitiesService.getActivity.mockResolvedValue(defaultActivity)
    activitiesService.getAllocationExclusionsHistory.mockResolvedValue([])

    caseNotesService.getCaseNote.mockResolvedValue({
      text: 'test case note',
    } as CaseNote)
  })

  afterEach(() => jest.resetAllMocks())

  describe('GET', () => {
    it('should render the correct view when allocated by user not found', async () => {
      const allocation = {
        ...defaultAllocation,
        plannedSuspension: {
          plannedBy: 'joebloggs',
          dpsCaseNoteId: 'fe8eaa76-a7b1-4479-a0fc-cab287edda29',
        },
        allocatedBy: 'MIGRATION',
      } as Allocation

      activitiesService.getAllocation.mockResolvedValue(allocation)

      userService.getUserMap
        .mockResolvedValueOnce(joeBloggsUserMap)
        .mockRejectedValueOnce(new Error('Account for username MIGRATION not found'))

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/view-allocation', {
        allocation,
        isOnlyPay: true,
        activityIsPaid: true,
        isStarted: true,
        pay: expectedPay,
        prisonerName: 'John Smith',
        currentWeek: 1,
        dailySlots: expectedDailySlots,
        userMap: joeBloggsUserMap,
        suspensionCaseNote: {
          text: 'test case note',
        },
        latestScheduleChange: null,
      })
    })

    it('should render the correct view', async () => {
      const allocation = defaultAllocation

      activitiesService.getAllocation.mockResolvedValue(allocation)

      userService.getUserMap.mockResolvedValueOnce(joeBloggsUserMap).mockResolvedValueOnce(geoffTomsUserMap)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/view-allocation', {
        allocation,
        isOnlyPay: true,
        activityIsPaid: true,
        isStarted: true,
        pay: expectedPay,
        prisonerName: 'John Smith',
        currentWeek: 1,
        dailySlots: expectedDailySlots,
        userMap: new Map([
          [
            'joebloggs',
            {
              username: 'joebloggs',
              name: 'Joe Bloggs',
            },
          ],
          [
            'GEOFFT',
            {
              username: 'GEOFFT',
              name: 'Geoff Toms',
            },
          ],
        ]),
        suspensionCaseNote: {
          text: 'test case note',
        },
        latestScheduleChange: null,
      })
    })

    it('should render the correct view with multiple pay bands', async () => {
      const allocation = {
        ...defaultAllocation,
        id: 2,
        activityId: 2,
      } as Allocation

      const activity = {
        ...defaultActivity,
        id: 2,
        pay: [
          {
            incentiveLevel: 'Standard',
            prisonPayBand: {
              id: 1,
              alias: 'Low',
            },
            rate: 100,
          },
          {
            incentiveLevel: 'Standard',
            prisonPayBand: {
              id: 2,
              alias: 'High',
            },
            rate: 150,
          },
          {
            incentiveLevel: 'Standard',
            prisonPayBand: {
              id: 1,
              alias: 'Low',
            },
            rate: 97,
            startDate: payStartDate,
          },
        ],
      } as unknown as Activity

      req = {
        params: {
          allocationId: 2,
        },
      } as unknown as Request

      activitiesService.getAllocation.mockResolvedValue(allocation)
      activitiesService.getActivity.mockResolvedValue(activity)

      userService.getUserMap.mockResolvedValueOnce(joeBloggsUserMap).mockResolvedValueOnce(geoffTomsUserMap)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/view-allocation', {
        allocation,
        isOnlyPay: false,
        activityIsPaid: true,
        isStarted: true,
        pay: expectedPay,
        prisonerName: 'John Smith',
        currentWeek: 1,
        dailySlots: expectedDailySlots,
        userMap: new Map([
          [
            'joebloggs',
            {
              username: 'joebloggs',
              name: 'Joe Bloggs',
            },
          ],
          [
            'GEOFFT',
            {
              username: 'GEOFFT',
              name: 'Geoff Toms',
            },
          ],
        ]),
        suspensionCaseNote: {
          text: 'test case note',
        },
        latestScheduleChange: null,
      })
    })

    it('should render the most recent prisoner session modification when the schedule changed after allocation', async () => {
      const allocation = defaultAllocation

      const activity = {
        ...defaultActivity,
        schedules: [
          {
            ...activitySchedule,
            updatedTime: '2024-05-10T12:00:00',
            updatedBy: 'SCHEDULE_USER',
          },
        ],
      } as unknown as Activity

      const exclusionHistory = [
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
      ] as ExclusionRevision[]

      activitiesService.getAllocation.mockResolvedValue(allocation)
      activitiesService.getActivity.mockResolvedValue(activity)
      activitiesService.getAllocationExclusionsHistory.mockResolvedValue(exclusionHistory)

      userService.getUserMap
        .mockResolvedValueOnce(
          new Map([
            [
              'joebloggs',
              {
                username: 'joebloggs',
                name: 'Joe Bloggs',
              },
            ],
            [
              'LATEST_USER',
              {
                username: 'LATEST_USER',
                name: 'S Harrison',
              },
            ],
          ]) as unknown as Map<string, UserDetails>,
        )
        .mockResolvedValueOnce(geoffTomsUserMap)

      await handler.GET(req, res)

      expect(activitiesService.getAllocationExclusionsHistory).toHaveBeenCalledWith(1, res.locals.user)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/view-allocation',
        expect.objectContaining({
          latestScheduleChange: {
            updatedDateTime: '2024-05-09T10:30:00',
            updatedBy: 'LATEST_USER',
          },
          userMap: new Map([
            [
              'joebloggs',
              {
                username: 'joebloggs',
                name: 'Joe Bloggs',
              },
            ],
            [
              'LATEST_USER',
              {
                username: 'LATEST_USER',
                name: 'S Harrison',
              },
            ],
            [
              'GEOFFT',
              {
                username: 'GEOFFT',
                name: 'Geoff Toms',
              },
            ],
          ]),
        }),
      )
    })

    it('should not render schedule change details when the schedule has not changed since allocation', async () => {
      const allocation = defaultAllocation

      const activity = {
        ...defaultActivity,
        schedules: [
          {
            ...activitySchedule,
            updatedTime: '2024-05-03T13:21:59',
            updatedBy: 'SCHEDULE_USER',
          },
        ],
      } as unknown as Activity

      const exclusionHistory = [
        {
          weekNumber: 1,
          timeSlots: ['AM'],
          dayOfWeek: 'MONDAY',
          revisionType: 'ADDED',
          revision: 1,
          updatedBy: 'LATEST_USER',
          updatedDateTime: '2024-05-09T10:30:00',
        },
      ] as ExclusionRevision[]

      activitiesService.getAllocation.mockResolvedValue(allocation)
      activitiesService.getActivity.mockResolvedValue(activity)
      activitiesService.getAllocationExclusionsHistory.mockResolvedValue(exclusionHistory)

      userService.getUserMap.mockResolvedValueOnce(joeBloggsUserMap).mockResolvedValueOnce(geoffTomsUserMap)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/view-allocation',
        expect.objectContaining({
          latestScheduleChange: null,
          userMap: new Map([
            [
              'joebloggs',
              {
                username: 'joebloggs',
                name: 'Joe Bloggs',
              },
            ],
            [
              'GEOFFT',
              {
                username: 'GEOFFT',
                name: 'Geoff Toms',
              },
            ],
          ]),
        }),
      )
    })
  })
})
