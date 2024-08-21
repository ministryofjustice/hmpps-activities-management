import { Request, Response } from 'express'
import SessionTimesRoutes from './sessionTimes'
import ActivitiesService from '../../../../services/activitiesService'
import { PrisonRegime } from '../../../../@types/activitiesAPI/types'
import SimpleTime from '../../../../commonValidationTypes/simpleTime'
import TimeSlot from '../../../../enum/timeSlot'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

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

describe('Route Handlers - Create an activity schedule - session times', () => {
  const handler = new SessionTimesRoutes(activitiesService)
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
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/session-times', {
        regimeTimes: [
          { amFinish: '11:45', amStart: '08:30', dayOfWeek: 'TUESDAY' },
          { dayOfWeek: 'FRIDAY', edFinish: '19:15', edStart: '17:30', pmFinish: '16:45', pmStart: '13:45' },
        ],
        sessionSlots: [
          {
            dayOfWeek: 'TUESDAY',
            timeSlot: 'AM',
            start: '08:30',
            finish: '11:45',
            isFirst: true,
          },
          {
            dayOfWeek: 'FRIDAY',
            timeSlot: 'PM',
            start: '13:45',
            finish: '16:45',
            isFirst: true,
          },
          {
            dayOfWeek: 'FRIDAY',
            timeSlot: 'ED',
            start: '17:30',
            finish: '19:15',
            isFirst: false,
          },
        ],
      })
    })
  })

  describe('POST', () => {
    it('when using custom times redirect to the location page', async () => {
      const startMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      const endMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()

      const startTime = new SimpleTime()
      startTime.hour = 5
      startTime.minute = 30

      startMap.set('MONDAY-AM', startTime)

      const endTime = new SimpleTime()
      endTime.hour = 9
      endTime.minute = 44

      endMap.set('MONDAY-AM', endTime)

      req.body = {
        startTime: startMap,
        endTime: endMap,
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.customSlots).toEqual([
        {
          customStartTime: '05:30',
          customEndTime: '09:44',
          daysOfWeek: ['MONDAY'],
          friday: false,
          monday: true,
          saturday: false,
          sunday: false,
          thursday: false,
          timeSlot: TimeSlot.AM,
          tuesday: false,
          wednesday: false,
          weekNumber: 1,
        },
      ])

      expect(res.redirectOrReturn).toHaveBeenCalledWith('location')
    })
  })

  // FIXME: validation needs implementing
  // describe('type validation', () => {
  //   it('validation fails if a value is not entered', async () => {})
  // })
})
