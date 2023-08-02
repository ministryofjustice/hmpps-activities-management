import { Request, Response } from 'express'
import ScheduleFrequencyRoutes from './scheduleFrequency'

describe('Route Handlers - Create an activity - Schedule frequency', () => {
  const handler = new ScheduleFrequencyRoutes()
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
      redirectOrReturn: jest.fn(),
      redirectOrReturnWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createJourney: {},
      },
      body: {},
      query: {},
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/schedule-frequency')
    })
  })

  describe('POST', () => {
    it('should update session schedule weeks and redirect to week 1 of days and time page', async () => {
      expect(req.session.createJourney.scheduleWeeks).toBeUndefined()

      req.body.scheduleFrequency = 'WEEKLY'

      await handler.POST(req, res)

      expect(req.session.createJourney.scheduleWeeks).toEqual(1)
      expect(res.redirect).toBeCalledWith('days-and-times/1')
    })

    it('should remove invalid slots', async () => {
      req.session.createJourney = {
        scheduleWeeks: 2,
        slots: {
          '1': {
            days: ['monday'],
            timeSlotsMonday: ['AM'],
            timeSlotsTuesday: [],
            timeSlotsWednesday: [],
            timeSlotsThursday: [],
            timeSlotsFriday: [],
            timeSlotsSaturday: [],
            timeSlotsSunday: [],
          },
          '2': {
            days: ['tuesday'],
            timeSlotsMonday: [],
            timeSlotsTuesday: ['AM'],
            timeSlotsWednesday: [],
            timeSlotsThursday: [],
            timeSlotsFriday: [],
            timeSlotsSaturday: [],
            timeSlotsSunday: [],
          },
        },
      }

      req.body.scheduleFrequency = 'WEEKLY'

      await handler.POST(req, res)

      expect(req.session.createJourney.scheduleWeeks).toEqual(1)
      expect(req.session.createJourney.slots['1']).toEqual({
        days: ['monday'],
        timeSlotsMonday: ['AM'],
        timeSlotsTuesday: [],
        timeSlotsWednesday: [],
        timeSlotsThursday: [],
        timeSlotsFriday: [],
        timeSlotsSaturday: [],
        timeSlotsSunday: [],
      })
      expect(req.session.createJourney.slots['2']).toBeUndefined()
    })
  })
})
