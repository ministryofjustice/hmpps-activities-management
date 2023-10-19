import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, startOfToday } from 'date-fns'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import StartDateRoutes, { StartDate } from './startDate'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import { Allocation } from '../../../../@types/activitiesAPI/types'
import { formatDatePickerDate, formatIsoDate } from '../../../../utils/datePickerUtils'
import { AllocateToActivityJourney } from '../../allocate-to-activity/journey'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Edit allocation - Start date', () => {
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
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      params: {
        allocationId: 1,
      },
      session: {},
    } as unknown as Request
  })

  describe('GET', () => {
    const allocation = {
      id: 1,
      prisonerNumber: 'ABC123',
      bookingId: 1,
      activitySummary: 'Maths Level 1',
      scheduleId: 1,
      activityId: 1,
      scheduleDescription: '',
      isUnemployment: false,
      startDate: '2023-01-01',
      endDate: '2023-01-31',
      prisonPayBand: {
        id: 1,
        displaySequence: 1,
        alias: 'Low',
        description: 'Low',
        nomisPayBand: 1,
        prisonCode: 'MDI',
      },
      status: 'ACTIVE',
    } as Allocation

    beforeEach(() => {
      when(activitiesService.getAllocation).calledWith(atLeast(1)).mockResolvedValue(allocation)
    })
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/allocation-dashboard/start-date')
    })
  })

  describe('POST', () => {
    it('should save entered start date in session and redirect to the allocation dashboard page', async () => {
      const today = startOfToday()
      const startDate = today

      req.session.allocateJourney = {
        allocationId: 1,
        activity: {
          activityId: 2,
        },
        inmate: {
          prisonerNumber: 'ABC123',
        },
      } as AllocateToActivityJourney
      req.body = { startDate }

      await handler.POST(req, res)

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/activities/allocation-dashboard/2/check-allocation/ABC123',
        'Allocation updated',
        "We've updated the start date for this allocation",
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
      const yesterday = addDays(new Date(), -1)
      const startDate = formatDatePickerDate(yesterday)

      const body = {
        startDate,
        allocateJourney: {
          activity: {
            startDate: yesterday,
          },
        },
      }

      const requestObject = plainToInstance(StartDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          property: 'startDate',
          error: "Enter a date after today's date",
        },
      ])
    })

    it('validation fails if start date is not before or same as end date', async () => {
      const today = startOfToday()
      const tomorrow = addDays(startOfToday(), 1)
      const nextWeek = addDays(today, 7)
      const startDate = formatDatePickerDate(nextWeek)

      const body = { startDate }

      const requestObject = plainToInstance(StartDate, {
        ...body,
        allocateJourney: {
          startDate: formatIsoDate(today),
          endDate: formatIsoDate(tomorrow),
          activity: {
            startDate: '2022-01-01',
            endDate: formatIsoDate(nextWeek),
          },
        },
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          property: 'startDate',
          error: `Enter a date on or before the allocation end date, ${formatDatePickerDate(tomorrow)}`,
        },
      ])
    })

    it('validation fails if start date is after activity end date', async () => {
      const tomorrow = addDays(new Date(), 1)

      const body = {
        startDate: formatDatePickerDate(tomorrow),
      }

      const requestObject = plainToInstance(StartDate, {
        ...body,
        allocateJourney: {
          activity: {
            startDate: '2022-04-04',
            endDate: '2022-04-04',
          },
        },
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'startDate', error: "Enter a date on or before the activity's end date, 04/04/2022" },
      ])
    })
  })
})
