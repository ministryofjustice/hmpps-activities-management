import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { ActivitySchedule, ExclusionRevision, PrisonerAllocations } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import activitySchedule from '../../../../services/fixtures/activity_schedule_1.json'
import ViewAllocationsRoutes from './viewAllocations'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/activitiesService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Exclusions - View allocations', () => {
  const handler = new ViewAllocationsRoutes(activitiesService, prisonService)

  let req: Request
  let res: Response

  const user = {
    username: 'joebloggs',
  }

  const schedule = activitySchedule as unknown as ActivitySchedule

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

  const baseAllocation = {
    id: 1,
    scheduleId: 1,
    prisonerNumber: 'ABC123å',
    startDate: '2022-05-19',
    allocatedTime: '2022-05-19T09:00:00',
    prisonPayBand: { id: 1 },
    exclusions: [{ weekNumber: 1, timeSlot: 'AM', monday: true, daysOfWeek: ['MONDAY'] }],
  } as unknown as PrisonerAllocations['allocations'][number]

  const mockAllocations = (allocations: PrisonerAllocations['allocations']) => {
    when(activitiesService.getActivePrisonPrisonerAllocations)
      .calledWith(['ABC123'], res.locals.user)
      .mockResolvedValue([
        {
          prisonerNumber: 'ABC123',
          allocations,
        },
      ] as PrisonerAllocations[])
  }

  const mockSchedule = (updatedTime?: string | null) => {
    when(activitiesService.getActivitySchedule)
      .calledWith(1, res.locals.user)
      .mockResolvedValue({
        ...schedule,
        updatedTime,
      } as unknown as ActivitySchedule)
  }

  const mockExclusionHistory = (history: ExclusionRevision[]) => {
    when(activitiesService.getAllocationExclusionsHistory).calledWith(1, res.locals.user).mockResolvedValue(history)
  }

  const createExclusionRevision = (updatedDateTime: string, revision = 1) =>
    ({
      weekNumber: 1,
      timeSlots: ['AM'],
      dayOfWeek: 'MONDAY',
      revisionType: 'REMOVED',
      revision,
      updatedBy: 'USER1',
      updatedDateTime,
    }) as unknown as ExclusionRevision

  const getRenderedActivities = () => {
    const renderMock = res.render as jest.Mock
    const [, viewData] = renderMock.mock.calls[0]

    return viewData.activities
  }

  beforeEach(() => {
    jest.resetAllMocks()

    res = {
      locals: {
        user,
      },
      render: jest.fn(),
    } as unknown as Response

    req = {
      params: {
        prisonerNumber: 'ABC123',
      },
      session: {},
    } as unknown as Request
  })

  describe('GET', () => {
    beforeEach(() => {
      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('ABC123', res.locals.user)
        .mockResolvedValue(prisonerInfo)

      mockAllocations([baseAllocation])
      mockSchedule('2022-06-01T10:00:00')
      mockExclusionHistory([])
    })

    it('should render the correct view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/exclusions/view-allocations', {
        activities: [
          {
            activityName: 'Entry level Maths 1',
            allocation: {
              allocatedTime: '2022-05-19T09:00:00',
              exclusions: [
                {
                  daysOfWeek: ['MONDAY'],
                  monday: true,
                  timeSlot: 'AM',
                  weekNumber: 1,
                },
              ],
              id: 1,
              prisonPayBand: {
                id: 1,
              },
              prisonerNumber: 'ABC123å',
              scheduleId: 1,
              startDate: '2022-05-19',
            },
            currentWeek: 1,
            scheduleLastChanged: '1 June 2022',
            scheduledSlots: {
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
            },
          },
        ],
        prisonerName: 'John Smith',
        prisonerNumber: 'ABC123',
      })

      expect(req.session.prisonerSearchBackLinkHref).toEqual('/activities/exclusions/prisoner/ABC123')
    })

    it('should use the prisoner schedule change when it is newer than the activity schedule change', async () => {
      mockSchedule('2024-01-10T10:00:00')
      mockExclusionHistory([createExclusionRevision('2024-02-15T12:00:00')])

      await handler.GET(req, res)

      expect(getRenderedActivities()[0].scheduleLastChanged).toEqual('15 February 2024')
    })

    it('should use the activity schedule change when it is newer than the prisoner schedule change', async () => {
      mockSchedule('2024-03-20T10:00:00')
      mockExclusionHistory([createExclusionRevision('2024-02-15T12:00:00')])

      await handler.GET(req, res)

      expect(getRenderedActivities()[0].scheduleLastChanged).toEqual('20 March 2024')
    })

    it('should use the latest prisoner schedule change when there are multiple revisions', async () => {
      mockSchedule(null)
      mockExclusionHistory([
        createExclusionRevision('2024-02-15T12:00:00', 1),
        createExclusionRevision('2024-04-21T09:30:00', 3),
        createExclusionRevision('2024-03-10T11:00:00', 2),
      ])

      await handler.GET(req, res)

      expect(getRenderedActivities()[0].scheduleLastChanged).toEqual('21 April 2024')
    })

    it('should not show an activity schedule change made before the prisoner was allocated', async () => {
      mockAllocations([
        {
          ...baseAllocation,
          allocatedTime: '2024-03-01T09:00:00',
        },
      ])

      mockSchedule('2024-02-20T10:00:00')
      mockExclusionHistory([])

      await handler.GET(req, res)

      expect(getRenderedActivities()[0].scheduleLastChanged).toBeNull()
    })

    it('should not show a prisoner schedule change made before the prisoner was allocated', async () => {
      mockAllocations([
        {
          ...baseAllocation,
          allocatedTime: '2024-03-01T09:00:00',
        },
      ])

      mockSchedule(null)
      mockExclusionHistory([createExclusionRevision('2024-02-25T12:00:00')])

      await handler.GET(req, res)

      expect(getRenderedActivities()[0].scheduleLastChanged).toBeNull()
    })

    it('should use a change made after allocation when the history also contains an older change', async () => {
      mockAllocations([
        {
          ...baseAllocation,
          allocatedTime: '2024-03-01T09:00:00',
        },
      ])

      mockSchedule('2024-02-20T10:00:00')
      mockExclusionHistory([
        createExclusionRevision('2024-02-25T12:00:00', 1),
        createExclusionRevision('2024-03-15T12:00:00', 2),
      ])

      await handler.GET(req, res)

      expect(getRenderedActivities()[0].scheduleLastChanged).toEqual('15 March 2024')
    })

    it('should not show a schedule change when neither schedule has been updated', async () => {
      mockSchedule(null)
      mockExclusionHistory([])

      await handler.GET(req, res)

      expect(getRenderedActivities()[0].scheduleLastChanged).toBeNull()
    })

    it('should render no activities when the prisoner has no allocations', async () => {
      mockAllocations([])

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/exclusions/view-allocations', {
        activities: [],
        prisonerName: 'John Smith',
        prisonerNumber: 'ABC123',
      })

      expect(activitiesService.getActivitySchedule).not.toHaveBeenCalled()
      expect(activitiesService.getAllocationExclusionsHistory).not.toHaveBeenCalled()
    })
  })
})
