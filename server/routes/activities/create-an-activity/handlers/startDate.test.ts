import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, subDays } from 'date-fns'
import { when } from 'jest-when'
import { associateErrorsWithProperty, formatDate } from '../../../../utils/utils'
import StartDateRoutes, { StartDate } from './startDate'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import activity from '../../../../services/fixtures/activity_1.json'
import { Activity } from '../../../../@types/activitiesAPI/types'
import { formatDatePickerDate, formatIsoDate } from '../../../../utils/datePickerUtils'
import { getNearestInvalidStartDate, isStartDateValid } from '../../../../utils/helpers/activityScheduleValidator'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../utils/helpers/activityScheduleValidator')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const isStartDateValidMock = isStartDateValid as jest.MockedFunction<typeof isStartDateValid>
const nearestInvalidStartDateMock = getNearestInvalidStartDate as jest.MockedFunction<typeof getNearestInvalidStartDate>

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
      addValidationError: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      params: {},
      journeyData: {
        createJourney: {},
      },
      routeContext: { mode: 'create ' },
    } as unknown as Request

    isStartDateValidMock.mockReturnValue(true)
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

      expect(req.journeyData.createJourney.startDate).toEqual(formatIsoDate(today))
      expect(res.redirectOrReturn).toHaveBeenCalledWith('end-date-option')
    })

    it('should save entered start date in database', async () => {
      const updatedActivity = {
        startDate: '2023-01-17',
      }

      when(activitiesService.updateActivity)
        .calledWith(atLeast(updatedActivity))
        .mockResolvedValueOnce(activity as unknown as Activity)

      const startDate = new Date()

      req = {
        journeyData: {
          createJourney: { activityId: 1, name: 'Maths level 1' },
        },
        routeContext: { mode: 'edit' },
        body: {
          startDate,
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/activities/view/1',
        'Activity updated',
        "You've updated the start date for Maths level 1",
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const startDate = ''

      const body = { startDate }

      const requestObject = plainToInstance(StartDate, body)
      const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
        errs.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual([{ property: 'startDate', error: 'Enter a valid start date' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const startDate = 'a/1/2023'

      const body = { startDate }

      const requestObject = plainToInstance(StartDate, body)
      const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
        errs.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual([{ property: 'startDate', error: 'Enter a valid start date' }])
    })

    it('validation fails if start date is in past', async () => {
      const startDate = formatDatePickerDate(addDays(new Date(), -1))

      const body = { startDate }

      const requestObject = plainToInstance(StartDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'startDate', error: 'Enter a date in the future' }])
    })

    it('validation fails if start date is today', async () => {
      const today = new Date()
      const startDate = formatDatePickerDate(today)

      const body = { startDate }

      const requestObject = plainToInstance(StartDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'startDate', error: 'Enter a date in the future' }])
    })

    it('validation fails if start date is after end date', async () => {
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

      expect(errors).toEqual([
        {
          property: 'startDate',
          error: `Enter a date on or before the activity’s scheduled end date, ${formatDatePickerDate(today)}`,
        },
      ])
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

    it('validation fails if start date makes date range invalid', async () => {
      const startDate = addDays(new Date(), 2)
      const nearestInvalidDate = subDays(startDate, 1)

      const body = { startDate: formatDatePickerDate(startDate) }

      const requestObject = plainToInstance(StartDate, body)

      isStartDateValidMock.mockReturnValue(false)
      nearestInvalidStartDateMock.mockReturnValue(nearestInvalidDate)

      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          property: 'startDate',
          error: `Enter a date before ${formatDate(nearestInvalidDate)}, so the days this activity runs are all before it’s scheduled to end`,
        },
      ])
    })
  })
})
