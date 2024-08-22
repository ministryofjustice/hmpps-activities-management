import { Request, Response } from 'express'
import { when } from 'jest-when'
import atLeast from '../../../../../jest.setup'
import ActivitiesService from '../../../../services/activitiesService'
import { Activity, PrisonRegime } from '../../../../@types/activitiesAPI/types'
import CustomTimesChangeDefaultOrCustomRoutes, { DefaultOrCustomTimes } from './customTimesChangeDefaultOrCustom'
import activity from '../../../../services/fixtures/activity_1.json'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

// const slots = [
//   {
//     id: 1575,
//     timeSlot: 'AM',
//     weekNumber: 1,
//     startTime: '09:15',
//     endTime: '11:30',
//     daysOfWeek: ['Mon'],
//     mondayFlag: true,
//     tuesdayFlag: false,
//     wednesdayFlag: false,
//     thursdayFlag: false,
//     fridayFlag: false,
//     saturdayFlag: false,
//     sundayFlag: false,
//   },
//   {
//     id: 1576,
//     timeSlot: 'ED',
//     weekNumber: 1,
//     startTime: '18:15',
//     endTime: '21:45',
//     daysOfWeek: ['Mon'],
//     mondayFlag: true,
//     tuesdayFlag: false,
//     wednesdayFlag: false,
//     thursdayFlag: false,
//     fridayFlag: false,
//     saturdayFlag: false,
//     sundayFlag: false,
//   },
// ]

// const activity = {
//   id: 1,
//   schedules: [
//     {
//       id: 1,
//       description: 'Test activity',
//       capacity: 10,
//       scheduleWeeks: 1,
//       slots,
//       startDate: '2024-08-26',
//       runsOnBankHoliday: false,
//       usePrisonRegimeTime: false,
//     },
//   ],
// } as Activity

const prisonRegime: PrisonRegime[] = [
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'MONDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'TUESDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'WEDNESDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'THURSDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'FRIDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'SATURDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'SUNDAY',
  },
]

describe('Select how to change the activity start and end times page', () => {
  const handler = new CustomTimesChangeDefaultOrCustomRoutes(activitiesService)
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
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createJourney: {
          activityId: 1,
          name: 'Test activity',
          scheduleWeeks: 1,
          slots: {
            '1': {
              days: ['monday'],
              timeSlotsMonday: ['AM', 'ED'],
            },
          },
        },
      },
      params: {
        mode: 'edit',
      },
    } as unknown as Request

    activitiesService.getPrisonRegime.mockReturnValue(Promise.resolve(prisonRegime))
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/create-an-activity/custom-times-change-default-or-custom',
        {
          regimeTimes: [
            { amFinish: '11:45', amStart: '08:30', dayOfWeek: 'MONDAY', edFinish: '19:15', edStart: '17:30' },
          ],
        },
      )
    })
  })

  describe('POST', () => {
    it('saves and redirects to the view page if the user selects to default to the prison regime times', async () => {
      const updatedActivity = {
        slots: [
          { weekNumber: 1, timeSlot: 'AM', monday: true },
          { weekNumber: 1, timeSlot: 'ED', monday: true },
        ],
        scheduleWeeks: 1,
      }

      when(activitiesService.updateActivity)
        .calledWith(atLeast(updatedActivity))
        .mockResolvedValueOnce(activity as unknown as Activity)

      req = {
        session: {
          createJourney: {
            activityId: 1,
            name: 'Test activity',
            scheduleWeeks: 1,
            slots: {
              '1': {
                days: ['monday'],
                timeSlotsMonday: ['AM', 'ED'],
              },
            },
          },
        },
        params: {
          mode: 'edit',
        },
        body: {
          selectHowToChangeTimes: DefaultOrCustomTimes.DEFAULT_PRISON_REGIME,
        },
      } as unknown as Request

      await handler.POST(req, res)
      expect(activitiesService.updateActivity).toHaveBeenCalledWith(1, updatedActivity, res.locals.user)
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `/activities/view/1`,
        'Activity updated',
        `You've updated the daily schedule for Test activity`,
      )
    })

    it('redirects to the session times page if the user selects to change times', async () => {
      req = {
        session: {
          createJourney: {
            activityId: 1,
            name: 'Test activity',
            scheduleWeeks: 1,
            slots: {
              '1': {
                days: ['monday'],
                timeSlotsMonday: ['AM', 'ED'],
              },
            },
          },
        },
        params: {
          mode: 'edit',
        },
        body: {
          selectHowToChangeTimes: DefaultOrCustomTimes.CUSTOM_START_END_TIMES,
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('session-times')
    })
  })
})
