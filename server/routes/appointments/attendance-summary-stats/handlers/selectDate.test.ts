import { Request, Response } from 'express'
import { addDays, subDays } from 'date-fns'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import SelectDateRoutes, { SelectDate } from './selectDate'
import { formatIsoDate } from '../../../../utils/datePickerUtils'
import DateOption from '../../../../enum/dateOption'
import { associateErrorsWithProperty } from '../../../../utils/utils'

describe('Route Handlers - Select Date', () => {
  const handler = new SelectDateRoutes()

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
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      date: new Date().toISOString(),
      dateOption: DateOption.TODAY,
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render select date', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/attendance-summary-stats/select-date')
    })
  })

  describe('POST', () => {
    it('should redirect with today', async () => {
      req = {
        body: {
          dateOption: DateOption.TODAY,
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`dashboard?date=${formatIsoDate(new Date())}`)
    })

    it('should redirect with yesterday', async () => {
      req = {
        body: {
          dateOption: DateOption.YESTERDAY,
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`dashboard?date=${formatIsoDate(subDays(new Date(), 1))}`)
    })

    it('should redirect with tomorrow', async () => {
      req = {
        body: {
          dateOption: DateOption.TOMORROW,
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`dashboard?date=${formatIsoDate(addDays(new Date(), 1))}`)
    })

    it('should redirect with the other date option', async () => {
      req = {
        body: {
          date: new Date(),
          dateOption: DateOption.OTHER,
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`dashboard?date=${formatIsoDate(new Date())}`)
    })
  })

  describe('Validation', () => {
    it('fails when no date option is selected', async () => {
      const requestObject = plainToInstance(SelectDate, {})
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ error: 'Select a date to record attendance for', property: 'dateOption' }]),
      )
    })

    it('fails when other is selected without a valid date', async () => {
      const requestObject = plainToInstance(SelectDate, { dateOption: DateOption.OTHER, date: 'not-a-date' })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ error: 'Enter a valid date', property: 'date' }]))
    })

    it('does not require a date when a preset option is selected', async () => {
      const requestObject = plainToInstance(SelectDate, { dateOption: DateOption.TODAY })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
