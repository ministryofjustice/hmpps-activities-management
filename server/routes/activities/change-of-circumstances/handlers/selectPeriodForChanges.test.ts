import { Request, Response } from 'express'
import { addDays, startOfToday, subDays } from 'date-fns'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import SelectPeriodForChangesRoutes, { TimePeriodForChanges } from './selectPeriodForChanges'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import { formatDatePickerDate, formatIsoDate } from '../../../../utils/datePickerUtils'
import DateOption from '../../../../enum/dateOption'

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
      expect(res.render).toHaveBeenCalledWith('pages/activities/change-of-circumstances/select-period')
    })
  })

  describe('POST', () => {
    it('redirect with the expected query params when today selected', async () => {
      req.body = { datePresetOption: DateOption.TODAY }
      const todaysDate = formatIsoDate(new Date())
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith(`view-changes?date=${todaysDate}`)
    })

    it('redirect with the expected query params for when yesterday is selected', async () => {
      req.body = { datePresetOption: DateOption.YESTERDAY }
      const yesterdaysDate = formatIsoDate(subDays(new Date(), 1))
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith(`view-changes?date=${yesterdaysDate}`)
    })

    it('redirect with the expected query params for when a custom date is selected', async () => {
      req.body = {
        datePresetOption: DateOption.OTHER,
        date: new Date('2022-01-12'),
      }
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith(`view-changes?date=2022-01-12`)
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
      const body = { datePresetOption: DateOption.OTHER, date: {} }
      const requestObject = plainToInstance(TimePeriodForChanges, body)
      const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
        errs.flatMap(associateErrorsWithProperty),
      )
      expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
    })

    it('validation fails if preset option is other and an invalid date is provided', async () => {
      const body = { datePresetOption: DateOption.OTHER, date: '' }
      const requestObject = plainToInstance(TimePeriodForChanges, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
    })

    it('validation fails for option other and a date after today is provided', async () => {
      const tomorrow = addDays(startOfToday(), 1)
      const body = {
        datePresetOption: DateOption.OTHER,
        date: formatDatePickerDate(tomorrow),
      }
      const requestObject = plainToInstance(TimePeriodForChanges, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors).toEqual([{ property: 'date', error: 'Enter a date on or before today' }])
    })

    it('passes validation', async () => {
      const body = {
        datePresetOption: DateOption.OTHER,
        date: '27/02/2022',
      }
      const requestObject = plainToInstance(TimePeriodForChanges, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors).toHaveLength(0)
    })
  })
})
