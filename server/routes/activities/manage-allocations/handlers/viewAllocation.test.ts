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

import activityScheduleBiWeekly from '../../../../services/fixtures/activity_schedule_bi_weekly_1.json'
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
      updatedDateTime: '2026-05-06T09:15:00',
    },
    {
      weekNumber: 1,
      timeSlots: ['PM'],
      dayOfWeek: 'TUESDAY',
      revisionType: 'REMOVED',
      revision: 2,
      updatedBy: 'LATEST_USER',
      updatedDateTime: '2026-09-15T10:30:00',
    },
    {
      weekNumber: 2,
      timeSlots: ['AM'],
      dayOfWeek: 'WEDNESDAY',
      revisionType: 'ADDED',
      revision: 2,
      updatedBy: 'LATEST_USER',
      updatedDateTime: '2026-09-15T10:30:00',
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
        schedules: [activityScheduleBiWeekly],
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
        scheduleLastChanged: [
          {
            weekNumber: 1,
            changedAt: '2026-09-11T15:20:11',
            changedBy: 'DTHOMAS_GEN',
            addedSessions: [
              {
                weekNumber: 1,
                timeSlot: 'ED',
                dayOfWeek: 'THURSDAY',
              },
            ],
            removedSessions: [
              {
                weekNumber: 1,
                timeSlot: 'AM',
                dayOfWeek: 'MONDAY',
              },
              {
                weekNumber: 1,
                timeSlot: 'AM',
                dayOfWeek: 'WEDNESDAY',
              },
            ],
          },
          {
            weekNumber: 2,
            changedAt: '2026-09-14T17:43:19',
            changedBy: 'DTHOMAS_GEN',
            addedSessions: [],
            removedSessions: [
              {
                weekNumber: 2,
                timeSlot: 'PM',
                dayOfWeek: 'SATURDAY',
              },
            ],
          },
        ],
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
    it('should render latest prisoner schedule Changes ', async () => {
      mockAllocation()

      when(activitiesService.getAllocationExclusionsHistory).calledWith(1, user).mockResolvedValue(exclusionHistory)

      mockUserMap(['joebloggs', 'LATEST_USER'])
      mockUserMap(['GEOFFT'])

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/view-allocation',
        expect.objectContaining({
          twoWeekSchedule: true,
          latestScheduleChangeHistory: {
            week1: {
              type: 'EXCLUSION',
              weekNumber: 1,
              changedAt: '2026-09-15T10:30:00',
              changedBy: 'LATEST_USER',
              addedToSchedule: [
                {
                  weekNumber: 1,
                  dayOfWeek: 'TUESDAY',
                  timeSlots: ['PM'],
                },
              ],
              removedFromSchedule: [],
            },
            week2: {
              type: 'EXCLUSION',
              weekNumber: 2,
              changedAt: '2026-09-15T10:30:00',
              changedBy: 'LATEST_USER',
              addedToSchedule: [],
              removedFromSchedule: [
                {
                  weekNumber: 2,
                  dayOfWeek: 'WEDNESDAY',
                  timeSlots: ['AM'],
                },
              ],
            },
          },
        }),
      )
    })

    it('should render latest prisoner and activity schedule Changes for a 2 week schedule', async () => {
      mockAllocation({
        scheduleLastChanged: [
          {
            weekNumber: 1,
            changedAt: '2026-09-16T15:20:11',
            changedBy: 'DTHOMAS_GEN',
            addedSessions: [
              {
                weekNumber: 1,
                timeSlot: 'ED',
                dayOfWeek: 'THURSDAY',
              },
            ],
            removedSessions: [
              {
                weekNumber: 1,
                timeSlot: 'AM',
                dayOfWeek: 'MONDAY',
              },
              {
                weekNumber: 1,
                timeSlot: 'AM',
                dayOfWeek: 'WEDNESDAY',
              },
            ],
          },
        ],
      })

      when(activitiesService.getAllocationExclusionsHistory).calledWith(1, user).mockResolvedValue(exclusionHistory)

      mockUserMap(['joebloggs', 'LATEST_USER'])
      mockUserMap(['GEOFFT'])

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/view-allocation',
        expect.objectContaining({
          twoWeekSchedule: true,
          latestScheduleChangeHistory: {
            week1: {
              type: 'ACTIVITY',
              weekNumber: 1,
              changedAt: '2026-09-16T15:20:11',
              changedBy: 'DTHOMAS_GEN',
              addedToSchedule: [
                {
                  dayOfWeek: 'THURSDAY',
                  timeSlots: ['ED'],
                  weekNumber: 1,
                },
              ],
              removedFromSchedule: [
                {
                  dayOfWeek: 'MONDAY',
                  timeSlots: ['AM'],
                  weekNumber: 1,
                },
                {
                  dayOfWeek: 'WEDNESDAY',
                  timeSlots: ['AM'],
                  weekNumber: 1,
                },
              ],
            },
            week2: {
              type: 'EXCLUSION',
              weekNumber: 2,
              changedAt: '2026-09-15T10:30:00',
              changedBy: 'LATEST_USER',
              addedToSchedule: [],
              removedFromSchedule: [
                {
                  dayOfWeek: 'WEDNESDAY',
                  timeSlots: ['AM'],
                  weekNumber: 2,
                },
              ],
            },
          },
        }),
      )
    })

    it('should filter exclusion removal events for one week schedules when the session is not on the activity schedule', async () => {
      mockAllocation({
        scheduleLastChanged: [],
      })

      activitiesService.getActivity.mockResolvedValueOnce({
        id: 1,
        category: {
          code: 'EDUCATION',
          id: 1,
          name: 'Education',
        },
        paid: true,
        pay: [],
        schedules: [
          {
            ...activityScheduleBiWeekly,
            scheduleWeeks: 1,
            slots: [
              {
                id: 1,
                weekNumber: 1,
                timeSlot: 'AM',
                startTime: '09:00',
                endTime: '11:00',
                daysOfWeek: ['Mon'],
                mondayFlag: true,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
            ],
          },
        ],
        startDate: '2022-01-01',
      } as unknown as Activity)

      when(activitiesService.getAllocationExclusionsHistory)
        .calledWith(1, user)
        .mockResolvedValue([
          {
            weekNumber: 1,
            timeSlots: ['PM'],
            dayOfWeek: 'SUNDAY',
            revisionType: 'REMOVED',
            revision: 1,
            updatedBy: 'LATEST_USER',
            updatedDateTime: '2026-09-15T10:30:00',
          },
        ])

      mockUserMap(['joebloggs'])
      mockUserMap(['GEOFFT'])

      await handler.GET(req, res)

      const viewModel = (res.render as jest.Mock).mock.calls[0][1]

      expect(viewModel.twoWeekSchedule).toBe(false)

      expect(viewModel.latestScheduleChangeHistory).toEqual({
        week1: null,
        week2: null,
      })
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
          latestScheduleChangeHistory: expect.objectContaining({
            week1: expect.objectContaining({
              type: 'EXCLUSION',
              weekNumber: 1,
              changedAt: '2026-09-15T10:30:00',
              changedBy: 'LATEST_USER',
            }),
            week2: expect.objectContaining({
              type: 'EXCLUSION',
              weekNumber: 2,
              changedAt: '2026-09-15T10:30:00',
              changedBy: 'LATEST_USER',
            }),
          }),
        }),
      )
    })

    it('should handle changedBy user not found', async () => {
      mockAllocation({
        allocatedBy: 'MIGRATION',
      })
      when(activitiesService.getAllocationExclusionsHistory).calledWith(1, user).mockResolvedValue(exclusionHistory)

      mockUserMap(['joebloggs'])

      when(userService.getUserMap)
        .calledWith(atLeast(['LATEST_USER']))
        .mockRejectedValue(new Error('User not found'))

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/view-allocation',
        expect.objectContaining({
          latestScheduleChangeHistory: expect.objectContaining({
            week1: expect.objectContaining({
              type: 'EXCLUSION',
              weekNumber: 1,
              changedAt: '2026-09-15T10:30:00',
              changedBy: 'LATEST_USER',
            }),
            week2: expect.objectContaining({
              type: 'EXCLUSION',
              weekNumber: 2,
              changedAt: '2026-09-15T10:30:00',
              changedBy: 'LATEST_USER',
            }),
          }),
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
