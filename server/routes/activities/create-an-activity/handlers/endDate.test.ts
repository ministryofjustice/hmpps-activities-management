import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { addDays, startOfToday } from 'date-fns'
import { associateErrorsWithProperty, formatDate } from '../../../../utils/utils'
import EndDateRoutes, { EndDate } from './endDate'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import activity from '../../../../services/fixtures/activity_1.json'
import { Activity } from '../../../../@types/activitiesAPI/types'
import { formatDatePickerDate, formatIsoDate } from '../../../../utils/datePickerUtils'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

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

      const today = new Date()
      const endDate = today

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
      const endDateString = ''

      const body = { endDateString }

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
      const endDateString = 'a/1/2023'

      const body = { endDateString }

      const requestObject = plainToInstance(EndDate, {
        ...body,
        createJourney: {
          activity: {
            latestAllocationStartDate: '2022-04-04',
          },
        },
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'endDate', error: 'Enter a valid end date' }])
    })

    it('validation fails if end date is not in the future', async () => {
      const endDateString = formatDatePickerDate(startOfToday())

      const body = { endDateString }

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
      const endDateString = formatDatePickerDate(tomorrow)

      const body = { endDateString }

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
      const endDateString = formatDatePickerDate(tomorrow)
      const nextWeek = addDays(startOfToday(), 7)

      const body = { endDateString }

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
          error: `Enter a date on or after the activity start date, ${formatDatePickerDate(nextWeek)}`,
        },
      ])
    })

    it('validation fails if end date is before latest allocation start date', async () => {
      const tomorrow = addDays(startOfToday(), 1)
      const newActivityEndDate = formatDatePickerDate(tomorrow)
      const latestAllocationStartDate = addDays(tomorrow, 7)

      const body = { endDateString: newActivityEndDate }

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
      const endDateString = formatDatePickerDate(addDays(today, 1))

      const body = {
        endDateString,
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
