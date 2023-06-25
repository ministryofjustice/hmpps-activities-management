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
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/activitiesService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Edit allocation - Start date', () => {
  const handler = new StartDateRoutes(activitiesService, prisonService)
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
      params: {
        allocationId: 1,
      },
    } as unknown as Request
  })

  describe('GET', () => {
    beforeEach(() => {
      when(activitiesService.getAllocation)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          id: 1,
          prisonerNumber: 'ABC123',
          bookingId: 1,
          activitySummary: 'Maths Level 1',
          scheduleId: 1,
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
        })
      const prisonerInfo = {
        prisonerNumber: 'ABC123',
        firstName: 'John',
        lastName: 'Smith',
        cellLocation: '1-1-1',
      } as Prisoner

      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('ABC123', res.locals.user)
        .mockResolvedValue(prisonerInfo)
    })
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/allocation-dashboard/start-date', {
        allocationId: 1,
        endDate: '2023-01-31',
        prisonerName: 'John Smith',
        prisonerNumber: 'ABC123',
        scheduleId: 1,
        startDate: expect.objectContaining({
          day: 1,
          month: 1,
          year: 2023,
        }),
      })
    })
  })

  describe('POST', () => {
    it('should save entered start date in session and redirect to the allocation dashboard page', async () => {
      const today = new Date()
      const startDate = simpleDateFromDate(today)

      req.body = {
        startDate,
        endDate: formatDate(subDays(today, 1), 'yyyy-MM-dd'),
        allocationId: 1,
        scheduleId: 1,
        prisonerNumber: 'ABC123',
      }

      await handler.POST(req, res)

      expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
        '/allocation-dashboard/1/check-allocation/ABC123',
        'Allocation updated',
        "We've updated the start date for this allocation",
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

      expect(errors).toEqual([{ property: 'startDate', error: "Enter a date on or after today's date" }])
    })

    it('validation fails if start date is not before or same as end date', async () => {
      const today = new Date()
      const startDate = simpleDateFromDate(today)

      const body = {
        startDate,
        endDate: formatDate(subDays(today, 1), 'yyyy-MM-dd'),
        allocationId: 1,
        scheduleId: 1,
        prisonerNumber: 'ABC123',
      }

      const requestObject = plainToInstance(StartDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'startDate', error: 'Enter a date before the end date' }])
    })
  })
})
