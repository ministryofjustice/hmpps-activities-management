import { addWeeks, format, startOfTomorrow } from 'date-fns'
import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../../../services/activitiesService'
import SetUpPrisonerListMethodRoutes from './setUpPrisonerListMethod'
import HowToAddOptions from '../../../../../enum/allocations'
import { ActivitySchedule } from '../../../../../@types/activitiesAPI/types'
import MetricsService from '../../../../../services/metricsService'
import MetricsEvent from '../../../../../data/metricsEvent'

jest.mock('../../../../../services/activitiesService')
jest.mock('../../../../../services/metricsService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const metricsService = new MetricsService(null) as jest.Mocked<MetricsService>

describe('Allocate multiple people to an activity - method for adding list', () => {
  const tomorrow = startOfTomorrow()
  const nextWeek = addWeeks(tomorrow, 1)
  const handler = new SetUpPrisonerListMethodRoutes(activitiesService, metricsService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
      locals: {
        user: {
          username: 'test.user',
        },
      },
    } as unknown as Response

    req = {
      journeyData: {},
      query: {},
      params: {},
      session: {},
    } as unknown as Request
  })
  describe('GET', () => {
    it('should render the how to add prisoners view', async () => {
      await handler.GET(req, res)
      expect(metricsService.trackEvent).toHaveBeenCalledWith(
        MetricsEvent.CREATE_MULTIPLE_ALLOCATION_JOURNEY_STARTED(res.locals.user).addJourneyStartedMetrics(req),
      )
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/allocateMultiplePeople/setUpPrisonerListMethod',
      )
    })
  })
  describe('POST', () => {
    it('should redirect to select prisoner page', async () => {
      const schedule = {
        id: 100,
        description: 'Activity 100',
        internalLocation: {
          description: 'A-WING',
        },
        startDate: format(tomorrow, 'dd-MM-yyyy'),
        endDate: null,
        scheduleWeeks: 1,
        activity: {
          id: 100,
          inCell: false,
          onWing: false,
          offWing: true,
          paid: true,
        },
        instances: [
          {
            id: 153,
            date: format(tomorrow, 'yyyy-MM-dd'),
            startTime: '08:30',
            endTime: '11:45',
            timeSlot: 'AM',
            cancelled: false,
            cancelledTime: null,
            cancelledBy: null,
            attendances: [],
          },
          {
            id: 154,
            date: format(nextWeek, 'yyyy-MM-dd'),
            startTime: '08:30',
            endTime: '11:45',
            timeSlot: 'AM',
            cancelled: false,
            cancelledTime: null,
            cancelledBy: null,
            attendances: [],
          },
        ],
      } as ActivitySchedule
      req.body = {
        howToAdd: HowToAddOptions.SEARCH,
      }
      when(activitiesService.getActivitySchedule).mockResolvedValue(schedule)
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('select-prisoner')

      expect(req.journeyData.allocateJourney).toEqual({
        inmates: [],
        activity: {
          activityId: 100,
          scheduleId: 100,
          name: 'Activity 100',
          location: 'A-WING',
          inCell: false,
          onWing: false,
          offWing: true,
          startDate: format(tomorrow, 'dd-MM-yyyy'),
          endDate: null,
          scheduleWeeks: 1,
          paid: true,
        },
        scheduledInstance: {
          id: 153,
          date: format(tomorrow, 'yyyy-MM-dd'),
          startTime: '08:30',
          endTime: '11:45',
          timeSlot: 'AM',
          cancelled: false,
          cancelledTime: null,
          cancelledBy: null,
          attendances: [],
          startDateTime: `${format(tomorrow, 'yyyy-MM-dd')} 08:30`,
        },
      })
    })
  })
})
