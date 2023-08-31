import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, subDays } from 'date-fns'
import { when } from 'jest-when'
import { associateErrorsWithProperty, formatDate } from '../../../../utils/utils'
import EndDateRoutes, { EndDate } from './endDate'
import { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { Allocation } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/activitiesService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Edit allocation - End date', () => {
  const handler = new EndDateRoutes(activitiesService, prisonService)
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
      session: {
        allocateJourney: {
          startDate: '2099-12-15',
          endDate: '2099-12-31',
          inmate: {
            prisonerNumber: 'ABC123',
          },
          activity: {
            scheduleId: 1,
          },
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    const allocation = {
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
    } as Allocation

    beforeEach(() => {
      when(activitiesService.getAllocation).calledWith(atLeast(1)).mockResolvedValue(allocation)
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
      expect(res.render).toHaveBeenCalledWith('pages/activities/allocation-dashboard/end-date', {
        allocationId: 1,
        prisonerName: 'John Smith',
        prisonerNumber: 'ABC123',
        scheduleId: 1,
        endDate: expect.objectContaining({
          day: 31,
          month: 1,
          year: 2023,
        }),
        allocation,
      })
    })
  })

  describe('POST', () => {
    it('should save entered end date in session and redirect to the reason page', async () => {
      const today = new Date()
      const endDate = simpleDateFromDate(today)

      req.body = {
        endDate,
        startDate: formatDate(subDays(today, 1), 'yyyy-MM-dd'),
        allocationId: 1,
        scheduleId: 1,
        prisonerNumber: 'ABC123',
      }

      await handler.POST(req, res)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('reason')
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

    it('validation fails if end date is not after or same as start date', async () => {
      const endDate = simpleDateFromDate(new Date('2023-08-25'))

      const request = {
        endDate,
        startDate: formatDate(new Date('2023-08-25'), 'yyyy-MM-dd'),
        allocationId: 1,
        scheduleId: 1,
        prisonerNumber: 'ABC123',
        allocateJourney: {
          startDate: simpleDateFromDate(addDays(new Date('2023-08-26'), 1)),
          inmate: {
            prisonerNumber: 'ABC123',
          },
          activity: {
            scheduleId: 1,
          },
        },
      }

      const requestObject = plainToInstance(EndDate, request)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'endDate', error: 'Enter a date on or after the allocation start date, 27-08-2023' },
      ])
    })

    it('validation passes if end date is same as start date', async () => {
      const today = new Date()
      const endDate = simpleDateFromDate(today)

      const request = {
        endDate,
        startDate: formatDate(today, 'yyyy-MM-dd'),
        allocationId: 1,
        scheduleId: 1,
        prisonerNumber: 'ABC123',
        allocateJourney: {
          startDate: simpleDateFromDate(today),
          inmate: {
            prisonerNumber: 'ABC123',
          },
          activity: {
            scheduleId: 1,
          },
        },
      }

      const requestObject = plainToInstance(EndDate, request)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('validation passes if end date is after start date', async () => {
      const today = new Date()
      const endDate = simpleDateFromDate(addDays(today, 1))

      const request = {
        endDate,
        startDate: formatDate(today, 'yyyy-MM-dd'),
        allocationId: 1,
        scheduleId: 1,
        prisonerNumber: 'ABC123',
        allocateJourney: {
          startDate: simpleDateFromDate(today),
          inmate: {
            prisonerNumber: 'ABC123',
          },
          activity: {
            scheduleId: 1,
          },
        },
      }

      const requestObject = plainToInstance(EndDate, request)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
