import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty, formatDate } from '../../../../utils/utils'
import { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'
import EndDateRoutes, { EndDate } from './endDate'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import activity from '../../../../services/fixtures/activity_1.json'
import { Activity } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create an activity schedule - End date', () => {
  const handler = new EndDateRoutes(activitiesService)
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
        createJourney: {},
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/create-an-activity/end-date', {
        endDate: undefined,
      })
    })
  })

  describe('POST', () => {
    it('should save entered end date in session and redirect to the days and times page', async () => {
      const today = new Date()
      const endDate = simpleDateFromDate(today)

      req.body = {
        endDate,
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.endDate).toEqual(endDate)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('days-and-times')
    })

    it('should save entered end date in database', async () => {
      const updatedActivity = {
        endDate: '2023-01-17',
      }

      when(activitiesService.updateActivity)
        .calledWith(atLeast(updatedActivity))
        .mockResolvedValueOnce(activity as unknown as Activity)

      const today = new Date()
      const endDate = simpleDateFromDate(today)

      req = {
        session: {
          createJourney: { activityId: 1, name: 'Maths level 1' },
        },
        query: {
          fromEditActivity: true,
        },
        body: {
          endDate,
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
        '/activities/schedule/activities/1',
        'Activity updated',
        "We've updated the end date for Maths level 1",
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const endDate = {
        day: '',
        month: '',
        year: '',
      }

      const body = {
        endDate,
      }

      const requestObject = plainToInstance(EndDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'endDate', error: 'Enter a valid end date' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const endDate = {
        day: 'a',
        month: '1',
        year: '2023',
      }

      const body = {
        endDate,
      }

      const requestObject = plainToInstance(EndDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'endDate', error: 'Enter a valid end date' }])
    })

    it('validation fails if end date is not after start date', async () => {
      const today = new Date()
      const endDate = simpleDateFromDate(today)

      const body = {
        endDate,
        startDate: formatDate(today, 'yyyy-MM-dd'),
      }

      const requestObject = plainToInstance(EndDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'endDate', error: 'Enter a date after the start date' }])
    })
  })
})
