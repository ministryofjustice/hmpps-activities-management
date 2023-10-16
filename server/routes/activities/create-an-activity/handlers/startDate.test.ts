import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays } from 'date-fns'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import StartDateRoutes, { StartDate } from './startDate'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import activity from '../../../../services/fixtures/activity_1.json'
import { Activity } from '../../../../@types/activitiesAPI/types'
import { formatDatePickerDate, formatIsoDate } from '../../../../utils/datePickerUtils'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

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
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      params: {},
      session: {
        createJourney: {},
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/start-date')
    })
  })

  describe('POST', () => {
    it('should save entered start date in session and redirect to the end date option page', async () => {
      const today = new Date()

      req.body = { startDate: today }

      await handler.POST(req, res)

      expect(req.session.createJourney.startDate).toEqual(formatIsoDate(today))
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
      const startDate = today

      req = {
        session: {
          createJourney: { activityId: 1, name: 'Maths level 1' },
        },
        params: {
          mode: 'edit',
        },
        body: {
          startDate,
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/activities/view/1',
        'Activity updated',
        "We've updated the start date for Maths level 1",
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const startDate = ''

      const body = { startDate }

      const requestObject = plainToInstance(StartDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'startDate', error: 'Enter a valid start date' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const startDate = 'a/1/2023'

      const body = { startDate }

      const requestObject = plainToInstance(StartDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'startDate', error: 'Enter a valid start date' }])
    })

    it('validation fails if start date is in past', async () => {
      const startDate = formatDatePickerDate(addDays(new Date(), -1))

      const body = { startDate }

      const requestObject = plainToInstance(StartDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'startDate', error: 'Activity start date must be in the future' }])
    })

    it('validation fails if start date is today', async () => {
      const today = new Date()
      const startDate = formatDatePickerDate(today)

      const body = { startDate }

      const requestObject = plainToInstance(StartDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'startDate', error: 'Activity start date must be in the future' }])
    })

    it('validation fails if start date is not before or same as end date', async () => {
      const today = new Date()
      const startDate = formatDatePickerDate(addDays(today, 1))

      const body = {
        startDate,
        createJourney: {
          endDate: formatIsoDate(today),
        },
      }

      const requestObject = plainToInstance(StartDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'startDate', error: 'Enter a date before the activity end date' }])
    })

    it('validation fails if start date is not before or same as earliest allocation start date', async () => {
      const today = new Date()
      const startDate = formatDatePickerDate(addDays(today, 2))

      const body = { startDate }
      const allocationStartDate = addDays(today, 1)

      const requestObject = plainToInstance(StartDate, {
        ...body,
        createJourney: {
          earliestAllocationStartDate: formatIsoDate(allocationStartDate),
        },
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          property: 'startDate',
          error: `Enter a date on or before the first allocation start date, ${formatDatePickerDate(
            allocationStartDate,
          )}`,
        },
      ])
    })
  })
})
