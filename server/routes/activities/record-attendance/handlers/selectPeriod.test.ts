import { Request, Response } from 'express'
import { addDays, format, subDays } from 'date-fns'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import SelectPeriodRoutes, { TimePeriod } from './selectPeriod'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import { formatDatePickerDate } from '../../../../utils/datePickerUtils'

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
      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/select-period')
    })
  })

  describe('POST', () => {
    it("redirect with the expected query params for when today's date is selected", async () => {
      req.body = {
        datePresetOption: 'today',
      }

      const todaysDate = format(new Date(), 'yyyy-MM-dd')

      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith(`activities?date=${todaysDate}`)
    })

    it("redirect with the expected query params for when yesterday's date is selected", async () => {
      req.body = {
        datePresetOption: 'yesterday',
      }

      const yesterdaysDate = format(subDays(new Date(), 1), 'yyyy-MM-dd')

      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith(`activities?date=${yesterdaysDate}`)
    })

    it('redirect with the expected query params for when a custom date is selected', async () => {
      req.body = {
        datePresetOption: 'other',
        date: new Date('2022/12/01'),
      }

      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith(`activities?date=2022-12-01`)
    })
  })

  describe('type validation', () => {
    it('validation fails if values are not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(TimePeriod, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'datePresetOption', error: 'Select an activity or appointment date' }])
    })

    it('validation fails if invalid values are entered', async () => {
      const body = {
        datePresetOption: 'invalid',
      }

      const requestObject = plainToInstance(TimePeriod, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'datePresetOption', error: 'Select an activity or appointment date' }])
    })

    it('validation fails if preset option is other and a date is not provided', async () => {
      const body = {
        datePresetOption: 'other',
        date: {},
      }

      const requestObject = plainToInstance(TimePeriod, body)
      const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
        errs.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
    })

    it('validation fails if preset option is other and a bad date is provided', async () => {
      const body = {
        datePresetOption: 'other',
        date: '2022/2/31',
      }

      const requestObject = plainToInstance(TimePeriod, body)
      const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
        errs.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
    })

    it('validation fails if preset option is other and a date more than 60 days in the future is provided', async () => {
      const body = {
        datePresetOption: 'other',
        date: formatDatePickerDate(addDays(new Date(), 61)),
      }

      const requestObject = plainToInstance(TimePeriod, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'date', error: 'Enter a date up to 60 days in the future' }])
    })

    it('passes validation', async () => {
      const body = {
        datePresetOption: 'other',
        date: '27/2/2022',
      }

      const requestObject = plainToInstance(TimePeriod, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
