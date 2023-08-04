import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { addDays } from 'date-fns'
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
        createJourney: {
          latestAllocationStartDate: formatDate(new Date(), 'yyyy-MM-dd'),
          startDate: simpleDateFromDate(new Date()),
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/end-date', {
        endDate: undefined,
        startDate: formatDate(new Date(), 'yyyy-MM-dd'),
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
      expect(res.redirectOrReturn).toHaveBeenCalledWith('schedule-frequency')
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
    it('validation passes if a value is not entered', async () => {
      const endDate = {
        day: '',
        month: '',
        year: '',
      }

      const body = {
        endDate,
      }

      const requestObject = plainToInstance(EndDate, {
        ...body,
        createJourney: {
          activity: {
            latestAllocationStartDate: new Date('2022-04-04'),
          },
        },
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
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

      const requestObject = plainToInstance(EndDate, {
        ...body,
        createJourney: {
          activity: {
            latestAllocationStartDate: new Date('2022-04-04'),
          },
        },
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'endDate', error: 'Enter a valid end date' }])
    })

    it('validation passes if end date is same as start date', async () => {
      const today = new Date()
      const endDate = simpleDateFromDate(today)

      const body = {
        endDate,
        startDate: formatDate(today, 'yyyy-MM-dd'),
      }

      const requestObject = plainToInstance(EndDate, {
        ...body,
        createJourney: {
          latestAllocationStartDate: simpleDateFromDate(today),
        },
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('validation fails if end date is before start date', async () => {
      const today = new Date()
      const endDate = simpleDateFromDate(addDays(today, -1))

      const body = {
        endDate,
        startDate: formatDate(today, 'yyyy-MM-dd'),
      }

      const requestObject = plainToInstance(EndDate, {
        ...body,
        createJourney: {
          latestAllocationStartDate: simpleDateFromDate(addDays(today, -1)),
        },
      })

      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          property: 'endDate',
          error: 'Enter a date on or after the activity start date and latest allocation start date',
        },
      ])
    })

    it('validation fails if end date is before latest allocation start date', async () => {
      const today = new Date()
      const endDate = simpleDateFromDate(addDays(today, 1))

      const body = {
        endDate,
        latestAllocationStartDate: formatDate(addDays(today, 2), 'yyyy-MM-dd'),
      }

      const requestObject = plainToInstance(EndDate, {
        ...body,
        createJourney: {
          latestAllocationStartDate: simpleDateFromDate(addDays(today, 2)),
        },
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          property: 'endDate',
          error: 'Enter a date on or after the activity start date and latest allocation start date',
        },
      ])
    })

    it('validation passes if end date is after start date', async () => {
      const today = new Date()
      const endDate = simpleDateFromDate(addDays(today, 1))

      const body = {
        endDate,
        startDate: formatDate(today, 'yyyy-MM-dd'),
      }

      const requestObject = plainToInstance(EndDate, {
        ...body,
        createJourney: {
          latestAllocationStartDate: new Date('2022-04-04'),
        },
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
