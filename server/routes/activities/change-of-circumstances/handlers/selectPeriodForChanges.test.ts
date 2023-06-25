import { Request, Response } from 'express'
import { format, subDays } from 'date-fns'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import SelectPeriodForChangesRoutes, { TimePeriodForChanges } from './selectPeriodForChanges'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import { associateErrorsWithProperty } from '../../../../utils/utils'

describe('Route Handlers - Select period for changes', () => {
  const handler = new SelectPeriodForChangesRoutes()
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
      expect(res.render).toHaveBeenCalledWith('pages/change-of-circumstances/select-period')
    })
  })

  describe('POST', () => {
    it('redirect with the expected query params when today selected', async () => {
      req.body = { datePresetOption: 'today' }
      const todaysDate = format(new Date(), 'yyyy-MM-dd')
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith(`view-changes?date=${todaysDate}`)
    })

    it('redirect with the expected query params for when yesterday is selected', async () => {
      req.body = { datePresetOption: 'yesterday' }
      const yesterdaysDate = format(subDays(new Date(), 1), 'yyyy-MM-dd')
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith(`view-changes?date=${yesterdaysDate}`)
    })

    it('redirect with the expected query params for when a custom date is selected', async () => {
      req.body = {
        datePresetOption: 'other',
        date: plainToInstance(SimpleDate, { day: 1, month: 12, year: 2022 }),
      }
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith(`view-changes?date=2022-12-01`)
    })
  })

  describe('type validation', () => {
    it('validation fails if values are not entered', async () => {
      const body = {}
      const requestObject = plainToInstance(TimePeriodForChanges, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors).toEqual([{ property: 'datePresetOption', error: 'Select a date to query changes in the prison' }])
    })

    it('validation fails if invalid values are entered', async () => {
      const body = { datePresetOption: 'invalid' }
      const requestObject = plainToInstance(TimePeriodForChanges, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors).toEqual([{ property: 'datePresetOption', error: 'Select a date to query changes in the prison' }])
    })

    it('validation fails if preset option is other and a date is not provided', async () => {
      const body = { datePresetOption: 'other', date: {} }
      const requestObject = plainToInstance(TimePeriodForChanges, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
    })

    it('validation fails if preset option is other and an invaliddate is provided', async () => {
      const body = { datePresetOption: 'other', date: { day: 31, month: 2, year: 2022 } }
      const requestObject = plainToInstance(TimePeriodForChanges, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
    })

    it('validation fails for option other and a date after today is provided', async () => {
      const body = {
        datePresetOption: 'other',
        date: { day: 22, month: 2, year: new Date().getFullYear() + 1 },
      }
      const requestObject = plainToInstance(TimePeriodForChanges, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors).toEqual([{ property: 'date', error: 'Enter a date on or before today' }])
    })

    it('passes validation', async () => {
      const body = {
        datePresetOption: 'other',
        date: { day: 27, month: 2, year: 2022 },
      }
      const requestObject = plainToInstance(TimePeriodForChanges, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors).toHaveLength(0)
    })
  })
})
