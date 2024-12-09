import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, format } from 'date-fns'
import { associateErrorsWithProperty, formatDate } from '../../../../utils/utils'
import SuspendFromRoutes, { SuspendFrom } from './suspendFrom'
import { PrisonPayBand } from '../../../../@types/activitiesAPI/types'
import config from '../../../../config'

describe('Route Handlers - Suspensions - Suspend From', () => {
  const handler = new SuspendFromRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'test.user',
          activeCaseLoadId: 'TPR',
        },
      },
      render: jest.fn(),
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
      body: {},
      query: {},
      session: {
        suspendJourney: {
          allocations: [
            {
              activityId: 1,
              allocationId: 2,
              activityName: 'Activity A1',
              payBand: {} as PrisonPayBand,
            },
          ],
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the correct view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/suspensions/suspend-from')
    })
  })

  describe('POST', () => {
    it('should add todays date to the session if IMMEDIATELY is selected', async () => {
      req.body = {
        datePresetOption: 'immediately',
      }

      await handler.POST(req, res)

      expect(req.session.suspendJourney.suspendFrom).toEqual(format(new Date(), 'yyyy-MM-dd'))
    })

    it('should add tomorrows date to the session if TOMORROW is selected', async () => {
      req.body = {
        datePresetOption: 'tomorrow',
      }

      await handler.POST(req, res)

      expect(req.session.suspendJourney.suspendFrom).toEqual(format(addDays(new Date(), 1), 'yyyy-MM-dd'))
    })

    it('should add a different date to the session if OTHER is selected', async () => {
      req.body = {
        datePresetOption: 'other',
        date: '2026-04-20',
      }

      await handler.POST(req, res)

      expect(req.session.suspendJourney.suspendFrom).toEqual(format(new Date('2026-04-20'), 'yyyy-MM-dd'))
    })

    it('should redirect to the pay question page if the single allocation has a pay rate', async () => {
      config.suspendPrisonerWithPayToggleEnabled = true
      req.body = {
        datePresetOption: 'immediately',
      }

      await handler.POST(req, res)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('pay')
    })

    it('should redirect to the pay question page if there is an allocation with a pay rate being suspended', async () => {
      config.suspendPrisonerWithPayToggleEnabled = true
      req.session.suspendJourney = {
        inmate: {
          prisonerName: '',
          prisonerNumber: '',
        },
        allocations: [
          {
            activityId: 1,
            allocationId: 2,
            activityName: 'Activity A1',
            payBand: {} as PrisonPayBand,
          },
          {
            activityId: 2,
            allocationId: 3,
            activityName: 'Activity A2',
            payBand: null,
          },
        ],
      }

      req.body = {
        datePresetOption: 'immediately',
      }

      await handler.POST(req, res)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('pay')
    })

    it('should redirect to the case note question page if none of the allocations have paybands', async () => {
      config.suspendPrisonerWithPayToggleEnabled = true
      req.session.suspendJourney = {
        inmate: {
          prisonerName: '',
          prisonerNumber: '',
        },
        allocations: [
          {
            activityId: 2,
            allocationId: 3,
            activityName: 'Activity A2',
            payBand: null,
          },
        ],
      }

      req.body = {
        datePresetOption: 'immediately',
      }

      await handler.POST(req, res)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('case-note-question')
    })
    it('should redirect to the case note question page if the flag is off', async () => {
      config.suspendPrisonerWithPayToggleEnabled = false
      // req.session.suspendJourney = {
      //   inmate: {
      //     prisonerName: '',
      //     prisonerNumber: '',
      //   },
      //   allocations: [
      //     {
      //       activityId: 2,
      //       allocationId: 3,
      //       activityName: 'Activity A2',
      //       payBand: null,
      //     },
      //   ],
      // }

      req.body = {
        datePresetOption: 'immediately',
      }

      await handler.POST(req, res)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('case-note-question')
    })
  })

  describe('Validation', () => {
    it('date preset option must be populated', async () => {
      const body = {}

      const requestObject = plainToInstance(SuspendFrom, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'datePresetOption', error: 'Select a date' }]))
    })

    it('date preset option must be a known value', async () => {
      const body = {
        datePresetOption: 'unknown',
      }

      const requestObject = plainToInstance(SuspendFrom, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'datePresetOption', error: 'Select a date' }]))
    })

    it('tomorrow cant be selected if the allocation ends today', async () => {
      const body = {
        datePresetOption: 'tomorrow',
      }

      const requestObject = plainToInstance(SuspendFrom, {
        ...body,
        suspendJourney: { earliestAllocationEndDate: formatDate(new Date(), 'yyyy-MM-dd') },
      })
      const errors = await validate(requestObject, {}).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            property: 'datePresetOption',
            error: `Suspension must start on or before the allocation end date ${formatDate(new Date(), 'dd/MM/yyyy')}`,
          },
        ]),
      )
    })

    it('other date must be a valid date', async () => {
      const body = {
        datePresetOption: 'other',
        date: '04/13/2030',
      }

      const requestObject = plainToInstance(SuspendFrom, {
        ...body,
        suspendJourney: {
          earliestAllocationEndDate: formatDate(new Date('2030-05-10'), 'yyyy-MM-dd'),
        },
      })
      const errors = await validate(requestObject, {}).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            property: 'date',
            error: 'Enter a valid date',
          },
        ]),
      )
    })

    it('cannot enter a date before today', async () => {
      const body = {
        datePresetOption: 'other',
        date: '04/12/2023',
      }

      const requestObject = plainToInstance(SuspendFrom, {
        ...body,
        suspendJourney: {
          earliestAllocationEndDate: formatDate(new Date('2030-05-10'), 'yyyy-MM-dd'),
        },
      })
      const errors = await validate(requestObject, {}).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            property: 'date',
            error: "Enter a date on or after today's date",
          },
        ]),
      )
    })

    it('other date must not be higher than the end date of the allocation', async () => {
      const body = {
        datePresetOption: 'other',
        date: '11/05/2030',
      }

      const requestObject = plainToInstance(SuspendFrom, {
        ...body,
        suspendJourney: {
          earliestAllocationEndDate: formatDate(new Date('2030-05-10'), 'yyyy-MM-dd'),
        },
      })
      const errors = await validate(requestObject, {}).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            property: 'date',
            error: `Enter a date on or before the allocation end date, 10/05/2030`,
          },
        ]),
      )
    })
  })
})
