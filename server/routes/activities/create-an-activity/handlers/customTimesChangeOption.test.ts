import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import CustomTimesChangeOptionRoutes, { ScheduleChangeOption } from './customTimesChangeOption'
import { Activity } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

const activity = {
  id: 864,
  schedules: [
    {
      id: 843,
      description: 'Test activity',
      capacity: 10,
      scheduleWeeks: 1,
      slots: [
        {
          id: 1575,
          timeSlot: 'AM',
          weekNumber: 1,
          startTime: '09:15',
          endTime: '11:30',
          daysOfWeek: ['Mon'],
          mondayFlag: true,
          tuesdayFlag: false,
          wednesdayFlag: false,
          thursdayFlag: false,
          fridayFlag: false,
          saturdayFlag: false,
          sundayFlag: false,
        },
        {
          id: 1576,
          timeSlot: 'ED',
          weekNumber: 1,
          startTime: '18:15',
          endTime: '21:45',
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
      startDate: '2024-08-26',
      runsOnBankHoliday: false,
      usePrisonRegimeTime: false,
    },
  ],
} as Activity

describe('Select what you want to change in this activity’s schedule page', () => {
  const handler = new CustomTimesChangeOptionRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturnWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createJourney: {
          slots: {
            '1': {
              days: ['monday'],
              timeSlotsMonday: ['AM', 'ED'],
            },
          },
        },
      },
      params: {},
    } as unknown as Request

    activitiesService.getActivity.mockReturnValue(Promise.resolve(activity))
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/custom-times-change-option')
    })
  })

  describe('POST', () => {
    it('redirects to the day and times page if the user selects to change the days and sessions', async () => {
      req.params = {
        weekNumber: '1',
      }
      req.body = {
        selectWhatYouWantToChange: ScheduleChangeOption.DAYS_AND_SESSIONS,
      }
      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('../days-and-times/1?preserveHistory=true')
    })

    it('redirects to the appropriate if the user selects to change the activity start and end times and they are using custom times', async () => {
      req.body = {
        selectWhatYouWantToChange: ScheduleChangeOption.START_END_TIMES,
      }
      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('../custom-times-change-default-or-custom')
    })

    it('redirects to the appropriate if the user selects to change the activity start and end times and they are using regime times', async () => {
      const activity2 = activity
      activity2.schedules[0].usePrisonRegimeTime = true
      activitiesService.getActivity.mockReturnValue(Promise.resolve(activity))
      req.body = {
        selectWhatYouWantToChange: ScheduleChangeOption.START_END_TIMES,
      }
      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('../session-times')
    })
  })
})
