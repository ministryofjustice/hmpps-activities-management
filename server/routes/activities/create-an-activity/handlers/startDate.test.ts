import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, subDays } from 'date-fns'
import { when } from 'jest-when'
import { associateErrorsWithProperty, formatDate } from '../../../../utils/utils'
import StartDateRoutes, { StartDate } from './startDate'
import { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import activity from '../../../../services/fixtures/activity_1.json'
import { Activity } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create an activity schedule - Start date', () => {
  const handler = new StartDateRoutes(activitiesService)
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
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/start-date', {
        endDate: undefined,
      })
    })
  })

  describe('POST', () => {
    it('should save entered start date in session and redirect to the end date option page', async () => {
      const today = new Date()
      const startDate = simpleDateFromDate(today)

      req.body = {
        startDate,
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.startDate).toEqual(startDate)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('end-date-option')
    })

    it('should save entered start date in database', async () => {
      const updatedActivity = {
        startDate: '2023-01-17',
      }

      when(activitiesService.updateActivity)
        .calledWith(atLeast(updatedActivity))
        .mockResolvedValueOnce(activity as unknown as Activity)

      const today = new Date()
      const startDate = simpleDateFromDate(today)

      req = {
        session: {
          createJourney: { activityId: 1, name: 'Maths level 1' },
        },
        query: {
          fromEditActivity: true,
        },
        body: {
          startDate,
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
        '/activities/schedule/activities/1',
        'Activity updated',
        "We've updated the start date for Maths level 1",
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const startDate = {
        day: '',
        month: '',
        year: '',
      }

      const body = {
        startDate,
      }

      const requestObject = plainToInstance(StartDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'startDate', error: 'Enter a valid start date' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const startDate = {
        day: 'a',
        month: '1',
        year: '2023',
      }

      const body = {
        startDate,
      }

      const requestObject = plainToInstance(StartDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'startDate', error: 'Enter a valid start date' }])
    })

    it('validation fails if start date is in past', async () => {
      const yesterday = addDays(new Date(), -1)
      const startDate = simpleDateFromDate(yesterday)

      const body = {
        startDate,
      }

      const requestObject = plainToInstance(StartDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'startDate', error: 'Activity start date must be in the future' }])
    })

    it('validation fails if start date is today', async () => {
      const today = new Date()
      const startDate = simpleDateFromDate(today)

      const body = {
        startDate,
      }

      const requestObject = plainToInstance(StartDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'startDate', error: 'Activity start date must be in the future' }])
    })

    it('validation fails if start date is not before or same as end date', async () => {
      const today = new Date()
      const startDate = simpleDateFromDate(addDays(today, 1))

      const body = {
        startDate,
        endDate: formatDate(subDays(today, 1), 'yyyy-MM-dd'),
      }

      const requestObject = plainToInstance(StartDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'startDate', error: 'Enter a date before the end date' }])
    })
  })
})
