import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../utils/utils'
import DaysAndTimesRoutes, { DaysAndTimes } from './daysAndTimes'
import ActivitiesService from '../../../services/activitiesService'
import atLeast from '../../../../jest.setup'
import activity from '../../../services/fixtures/activity_1.json'
import { Activity } from '../../../@types/activitiesAPI/types'

jest.mock('../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create an activity schedule - Days and times', () => {
  const handler = new DaysAndTimesRoutes(activitiesService)
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
    } as unknown as Response

    req = {
      session: {
        createJourney: {},
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/create-an-activity/days-and-times')
    })
  })

  describe('POST', () => {
    it('should save entered days and times in session and redirect to the location page', async () => {
      req.body = {
        days: ['tuesday', 'friday'],
        timeSlotsTuesday: ['AM'],
        timeSlotsFriday: ['PM', 'ED'],
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.days).toEqual(['tuesday', 'friday'])
      expect(req.session.createJourney.timeSlotsTuesday).toEqual(['AM'])
      expect(req.session.createJourney.timeSlotsFriday).toEqual(['PM', 'ED'])
      expect(res.redirectOrReturn).toHaveBeenCalledWith('bank-holiday-option')
    })

    it('should save entered end date in database', async () => {
      const updatedActivity = {
        slots: [
          { timeSlot: 'AM', tuesday: true },
          { timeSlot: 'PM', friday: true },
          { timeSlot: 'ED', friday: true },
        ],
      }

      when(activitiesService.updateActivity)
        .calledWith(atLeast(updatedActivity))
        .mockResolvedValueOnce(activity as unknown as Activity)

      req = {
        session: {
          createJourney: {
            days: [],
            timeSlotsTuesday: [],
            timeSlotsFriday: [],
          },
        },
        query: {
          fromEditActivity: true,
        },
        body: {
          days: ['tuesday', 'friday'],
          timeSlotsTuesday: ['AM'],
          timeSlotsFriday: ['PM', 'ED'],
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('bank-holiday-option')
    })
  })

  describe('type validation', () => {
    it('validation fails if a day is not selected', async () => {
      const body = {
        timeSlotsTuesday: ['AM'],
        timeSlotsFriday: ['PM', 'ED'],
      }

      const requestObject = plainToInstance(DaysAndTimes, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'days', error: 'Select at least one day' }])
    })

    it('validation fails if no slots selected for a day', async () => {
      const body = {
        days: ['tuesday', 'friday'],
        timeSlotsFriday: ['PM', 'ED'],
      }

      const requestObject = plainToInstance(DaysAndTimes, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'timeSlotsTuesday', error: 'Select at least one time slot for Tuesday' }])
    })
  })
})
