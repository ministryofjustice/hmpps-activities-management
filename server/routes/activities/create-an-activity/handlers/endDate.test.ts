import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { addDays, addWeeks, startOfToday } from 'date-fns'
import { associateErrorsWithProperty, formatDate } from '../../../../utils/utils'
import EndDateRoutes, { EndDate } from './endDate'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import activity from '../../../../services/fixtures/activity_1.json'
import { Activity } from '../../../../@types/activitiesAPI/types'
import { formatDatePickerDate, formatIsoDate } from '../../../../utils/datePickerUtils'
import { getNearestInvalidEndDate, isEndDateValid } from '../../../../utils/helpers/activityScheduleValidator'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../utils/helpers/activityScheduleValidator')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const isEndDateValidMock = isEndDateValid as jest.MockedFunction<typeof isEndDateValid>
const nearestInvalidEndDateMock = getNearestInvalidEndDate as jest.MockedFunction<typeof getNearestInvalidEndDate>

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
      redirectWithSuccess: jest.fn(),
      addValidationError: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      params: {},
      session: {
        createJourney: {
          latestAllocationStartDate: formatIsoDate(new Date()),
          startDate: formatIsoDate(new Date()),
        },
      },
    } as unknown as Request

    isEndDateValidMock.mockReturnValue(true)
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/end-date')
    })
  })

  describe('POST', () => {
    it('should save entered end date in session and redirect to the days and times page', async () => {
      const today = new Date()

      req.body = { endDate: today }

      await handler.POST(req, res)

      expect(req.session.createJourney.endDate).toEqual(formatIsoDate(today))
      expect(res.redirectOrReturn).toHaveBeenCalledWith('schedule-frequency')
    })

    it('should save entered end date in database', async () => {
      const updatedActivity = {
        endDate: '2023-01-17',
      }

      when(activitiesService.updateActivity)
        .calledWith(atLeast(updatedActivity))
        .mockResolvedValueOnce(activity as unknown as Activity)

      const endDate = new Date()

      req.session.createJourney = {
        activityId: 1,
        name: 'Maths level 1',
      }
      req.params = {
        mode: 'edit',
      }
      req.body = {
        endDate,
      }

      await handler.POST(req, res)

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/activities/view/1',
        'Activity updated',
        "You've updated the end date for Maths level 1",
      )
    })
  })

  describe('type validation', () => {
    it('validation passes if a value is not entered', async () => {
      const endDate = ''

      const body = { endDate }

      const requestObject = plainToInstance(EndDate, {
        ...body,
        createJourney: {
          activity: {
            latestAllocationStartDate: '2022-04-04',
          },
        },
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('validation fails if a bad value is entered', async () => {
      const endDate = 'a/1/2023'

      const body = { endDate }

      const requestObject = plainToInstance(EndDate, {
        ...body,
        createJourney: {
          activity: {
            latestAllocationStartDate: '2022-04-04',
          },
        },
      })
      const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
        errs.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual([{ property: 'endDate', error: 'Enter a valid end date' }])
    })

    it('validation fails if end date is not in the future', async () => {
      const endDate = formatDatePickerDate(startOfToday())

      const body = { endDate }

      const requestObject = plainToInstance(EndDate, {
        ...body,
        createJourney: {
          activity: {
            latestAllocationStartDate: '2022-04-04',
          },
        },
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'endDate', error: 'Activity end date must be in the future' }])
    })

    it('validation passes if end date is same as start date', async () => {
      const tomorrow = addDays(startOfToday(), 1)
      const endDate = formatDatePickerDate(tomorrow)

      const body = { endDate }

      const requestObject = plainToInstance(EndDate, {
        ...body,
        createJourney: {
          startDate: formatIsoDate(tomorrow),
          latestAllocationStartDate: formatIsoDate(tomorrow),
        },
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('validation fails if end date is before start date', async () => {
      const tomorrow = addDays(startOfToday(), 1)
      const endDate = formatDatePickerDate(tomorrow)
      const nextWeek = addDays(startOfToday(), 7)

      const body = { endDate }

      const requestObject = plainToInstance(EndDate, {
        ...body,
        createJourney: {
          startDate: formatIsoDate(nextWeek),
        },
      })

      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          property: 'endDate',
          error: `Enter a date on or after the activity’s scheduled start date, ${formatDatePickerDate(nextWeek)}`,
        },
      ])
    })

    it('validation fails if end date is before latest allocation start date', async () => {
      const tomorrow = addDays(startOfToday(), 1)
      const newActivityEndDate = formatDatePickerDate(tomorrow)
      const latestAllocationStartDate = addDays(tomorrow, 7)

      const body = { endDate: newActivityEndDate }

      const requestObject = plainToInstance(EndDate, {
        ...body,
        createJourney: {
          latestAllocationStartDate: formatIsoDate(latestAllocationStartDate),
        },
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          property: 'endDate',
          error: `Enter a date on or after latest allocation start date, ${formatDatePickerDate(
            latestAllocationStartDate,
          )}`,
        },
      ])
    })

    it('validation passes if end date is after start date', async () => {
      const today = new Date()
      const endDate = formatDatePickerDate(addDays(today, 1))

      const body = {
        endDate,
      }

      const requestObject = plainToInstance(EndDate, {
        ...body,
        createJourney: {
          startDate: formatDate(today, 'yyyy-MM-dd'),
          latestAllocationStartDate: '2022-04-04',
        },
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('validation fails if end date makes date range invalid', async () => {
      const endDate = addWeeks(new Date(), 1)
      const nearestInvalidDate = addDays(endDate, 1)

      const body = { endDate: formatDatePickerDate(endDate) }

      const requestObject = plainToInstance(EndDate, {
        ...body,
        createJourney: {
          startDate: formatDate(addDays(new Date(), 1), 'yyyy-MM-dd'),
          endDate: formatDatePickerDate(endDate),
        },
      })

      isEndDateValidMock.mockReturnValue(false)
      nearestInvalidEndDateMock.mockReturnValue(nearestInvalidDate)

      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          property: 'endDate',
          error: `Enter a date after ${formatDate(nearestInvalidDate)}, so the days this activity runs are all before it’s scheduled to end.`,
        },
      ])
    })
  })
})
