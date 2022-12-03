import { Request, Response } from 'express'
import { format, subDays } from 'date-fns'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import SelectPeriodRoutes, { TimePeriod } from './selectPeriod'
import SimpleDate from '../../../commonValidationTypes/simpleDate'
import { associateErrorsWithProperty } from '../../../utils/utils'

describe('Route Handlers - Select period', () => {
  const handler = new SelectPeriodRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {} as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/record-attendance/select-period')
    })
  })

  describe('POST', () => {
    it("redirect with the expected query params for when today's date is selected", async () => {
      req.body = {
        datePresetOption: 'today',
        activitySlot: 'am',
      }

      const todaysDate = format(new Date(), 'yyyy-MM-dd')

      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith(`activities?date=${todaysDate}&slot=am`)
    })

    it("redirect with the expected query params for when yesterday's date is selected", async () => {
      req.body = {
        datePresetOption: 'yesterday',
        activitySlot: 'am',
      }

      const yesterdaysDate = format(subDays(new Date(), 1), 'yyyy-MM-dd')

      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith(`activities?date=${yesterdaysDate}&slot=am`)
    })

    it('redirect with the expected query params for when a custom date is selected', async () => {
      req.body = {
        datePresetOption: 'other',
        date: plainToInstance(SimpleDate, {
          day: 1,
          month: 12,
          year: 2022,
        }),
        activitySlot: 'am',
      }

      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith(`activities?date=2022-12-1&slot=am`)
    })
  })

  describe('type validation', () => {
    it('validation fails if values are not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(TimePeriod, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'datePresetOption', error: 'Select an activity or appointment date' },
        { property: 'activitySlot', error: 'Select a time period' },
      ])
    })

    it('validation fails if invalid values are entered', async () => {
      const body = {
        datePresetOption: 'invalid',
        activitySlot: 'invalid',
      }

      const requestObject = plainToInstance(TimePeriod, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'datePresetOption', error: 'Select an activity or appointment date' },
        { property: 'activitySlot', error: 'Select a time period' },
      ])
    })

    it('validation fails if preset option is other and a date is not provided', async () => {
      const body = {
        datePresetOption: 'other',
        date: {},
        activitySlot: 'am',
      }

      const requestObject = plainToInstance(TimePeriod, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
    })

    it('validation fails if preset option is other and a bad date is provided', async () => {
      const body = {
        datePresetOption: 'other',
        date: {
          day: 31,
          month: 2,
          year: 2022,
        },
        activitySlot: 'am',
      }

      const requestObject = plainToInstance(TimePeriod, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
    })

    it('passes validation', async () => {
      const body = {
        datePresetOption: 'other',
        date: {
          day: 27,
          month: 2,
          year: 2022,
        },
        activitySlot: 'am',
      }

      const requestObject = plainToInstance(TimePeriod, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
