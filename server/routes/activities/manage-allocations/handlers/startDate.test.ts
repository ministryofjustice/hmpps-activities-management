import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays } from 'date-fns'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import StartDateRoutes, { StartDate } from './startDate'
import { formatDatePickerDate, formatIsoDate } from '../../../../utils/datePickerUtils'
import ActivitiesService from '../../../../services/activitiesService'

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
          activeCaseLoadId: 'MDI',
        },
      },
      render: jest.fn(),
      redirectOrReturn: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      params: { mode: 'create', allocationId: 1 },
      session: {
        allocateJourney: {
          inmate: {
            prisonerName: 'John Smith',
          },
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/start-date')
    })
  })

  describe('POST', () => {
    it('should save entered start date in session and redirect to the end date option page', async () => {
      req.body = { startDate: new Date() }
      await handler.POST(req, res)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('end-date-option')
    })

    it('edit mode should update the allocation and redirect with success', async () => {
      req.params.mode = 'edit'

      req.body = { startDate: new Date() }
      await handler.POST(req, res)

      expect(activitiesService.updateAllocation).toHaveBeenCalledWith(res.locals.user.activeCaseLoadId, 1, {
        startDate: formatIsoDate(new Date()),
      })
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `/activities/allocations/view/1`,
        'Allocation updated',
        `We've updated the start date for this allocation`,
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const startDate = ''

      const body = { startDate }

      const requestObject = plainToInstance(StartDate, {
        ...body,
        allocateJourney: {
          activity: {
            startDate: '2022-04-04',
            endDate: '2050-04-04',
          },
        },
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'startDate', error: 'Enter a valid start date' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const startDate = 'a/1/2023'

      const body = { startDate }

      const requestObject = plainToInstance(StartDate, {
        ...body,
        allocateJourney: {
          activity: {
            startDate: '2022-04-04',
            endDate: '2050-04-04',
          },
        },
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'startDate', error: 'Enter a valid start date' }])
    })

    it('validation fails if start date is in past', async () => {
      const yesterday = addDays(new Date(), -1)
      const startDate = formatDatePickerDate(yesterday)

      const body = { startDate }

      const requestObject = plainToInstance(StartDate, {
        ...body,
        allocateJourney: {
          activity: {
            startDate: '2022-04-04',
            endDate: '2050-04-04',
          },
        },
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'startDate', error: "Enter a date after today's date" }])
    })

    it('validation fails if start date is before activity start date', async () => {
      const tomorrow = addDays(new Date(), 1)

      const body = {
        startDate: formatDatePickerDate(addDays(tomorrow, 1)),
      }

      const requestObject = plainToInstance(StartDate, {
        ...body,
        allocateJourney: {
          activity: {
            startDate: '2024-04-04',
            endDate: '2050-04-04',
          },
        },
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'startDate', error: "Enter a date on or after the activity's start date, 04/04/2024" },
      ])
    })

    it('validation fails if start date is after activity end date', async () => {
      const tomorrow = addDays(new Date(), 1)

      const body = {
        startDate: formatDatePickerDate(addDays(tomorrow, 1)),
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
        {
          property: 'startDate',
          error: `Enter a date on or before the activity's end date, 04/04/2022`,
        },
      ])
    })
  })
})
