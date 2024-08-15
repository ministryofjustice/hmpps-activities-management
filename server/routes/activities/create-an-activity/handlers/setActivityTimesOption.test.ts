import { Request, Response } from 'express'
import ActivityTimesOptionRoutes from './setActivityTimesOption'
import ActivitiesService from '../../../../services/activitiesService'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

const prisonRegime = [
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

describe('Route Handlers - Create an activity schedule - activity times option', () => {
  const handler = new ActivityTimesOptionRoutes(activitiesService)
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
      redirectOrReturn: jest.fn(),
      redirectOrReturnWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createJourney: {
          slots: {
            '1': {
              days: ['tuesday', 'friday'],
              timeSlotsTuesday: ['AM'],
              timeSlotsFriday: ['PM', 'ED'],
            },
          },
        },
      },
      params: {},
    } as unknown as Request

    activitiesService.getPrisonRegime.mockReturnValue(Promise.resolve(prisonRegime))
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/activity-times-option', {
        regimeTimes: [
          { amFinish: '11:45', amStart: '08:30', dayOfWeek: 'TUESDAY' },
          { dayOfWeek: 'FRIDAY', edFinish: '19:15', edStart: '17:30', pmFinish: '16:45', pmStart: '13:45' },
        ],
      })
    })
  })

  // describe('POST', () => {
  //   it('should save selected option in session and redirect to location page', async () => {
  //     req.body = {
  //       runsOnBankHoliday: 'yes',
  //     }

  //     await handler.POST(req, res)

  //     expect(req.session.createJourney.runsOnBankHoliday).toEqual(true)
  //     expect(res.redirectOrReturn).toHaveBeenCalledWith('location')
  //   })

  //   it('should save selected option in session and redirect to set activity times page, if custom start End times flag is enabled', async () => {
  //     config.customStartEndTimesEnabled = true
  //     req.body = {
  //       runsOnBankHoliday: 'yes',
  //     }

  //     await handler.POST(req, res)

  //     expect(req.session.createJourney.runsOnBankHoliday).toEqual(true)
  //     expect(res.redirectOrReturn).toBeCalledWith('../set-activity-times')
  //   })

  //   it('should save entered end date in database', async () => {
  //     const updatedActivity = {
  //       runsOnBankHoliday: true,
  //     }

  //     when(activitiesService.updateActivity)
  //       .calledWith(atLeast(updatedActivity))
  //       .mockResolvedValueOnce(activity as unknown as Activity)

  //     const runsOnBankHoliday = true

  //     req = {
  //       session: {
  //         createJourney: { activityId: 1, name: 'Maths level 1' },
  //       },
  //       params: {
  //         mode: 'edit',
  //       },
  //       body: {
  //         runsOnBankHoliday,
  //       },
  //     } as unknown as Request

  //     await handler.POST(req, res)

  //     expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
  //       '/activities/view/1',
  //       'Activity updated',
  //       "You've updated the bank holiday option for Maths level 1",
  //     )
  //   })
  // })

  // describe('type validation', () => {
  //   it('validation fails if a value is not entered', async () => {
  //     const body = {
  //       runsOnBankHoliday: '',
  //     }

  //     const requestObject = plainToInstance(BankHolidayOption, body)
  //     const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

  //     expect(errors).toEqual([
  //       { property: 'runsOnBankHoliday', error: 'Select if the activity will run on bank holidays' },
  //     ])
  //   })
  // })
})
