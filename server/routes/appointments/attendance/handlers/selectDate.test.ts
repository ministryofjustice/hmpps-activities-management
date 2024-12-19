import { Request, Response } from 'express'
import { addWeeks, format } from 'date-fns'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import SelectDateRoutes, { SelectDate } from './selectDate'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import DateOption from '../../../../enum/dateOption'

describe('Appointment attendance routes - select date', () => {
  const handler = new SelectDateRoutes()
  let req: Request
  let res: Response

  const prisonCode = 'MDI'

  beforeEach(() => {
    res = {
      locals: {
        user: {
          activeCaseLoadId: prisonCode,
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {},
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('renders the expected view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/attendance/select-date')
    })
  })

  describe('POST', () => {
    afterEach(() => {
      expect(req.session.recordAppointmentAttendanceJourney).toEqual({})
    })

    it('redirects with today date option', async () => {
      req.body = {
        dateOption: DateOption.TODAY,
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`summaries?dateOption=${DateOption.TODAY}`)
    })

    it('redirects with yesterday date option', async () => {
      req.body = {
        dateOption: DateOption.YESTERDAY,
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`summaries?dateOption=${DateOption.YESTERDAY}`)
    })

    it('redirects with other date option and entered date', async () => {
      const nextWeek = addWeeks(new Date(), 1)

      req.body = {
        dateOption: DateOption.OTHER,
        date: nextWeek,
      }

      const expectedDateValue = format(nextWeek, 'yyyy-MM-dd')

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`summaries?dateOption=${DateOption.OTHER}&date=${expectedDateValue}`)
    })
  })

  describe('Validation', () => {
    it('validation fails if values are not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(SelectDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'dateOption', error: 'Select a date to record attendance for' }])
    })

    it('validation fails if invalid values are entered', async () => {
      const body = {
        dateOption: 'invalid',
      }

      const requestObject = plainToInstance(SelectDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'dateOption', error: 'Select a date to record attendance for' }])
    })

    it('validation fails if date option is other and a date is not provided', async () => {
      const body = {
        dateOption: DateOption.OTHER,
        date: {},
      }

      const requestObject = plainToInstance(SelectDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
    })

    it('validation fails if date option is other and an invalid date is provided', async () => {
      const body = {
        dateOption: DateOption.OTHER,
        date: { day: 31, month: 2, year: 2022 },
      }

      const requestObject = plainToInstance(SelectDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
    })

    it('passes validation if date option is today', async () => {
      const body = {
        dateOption: DateOption.TODAY,
      }

      const requestObject = plainToInstance(SelectDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('passes validation if date option is yesterday', async () => {
      const body = {
        dateOption: DateOption.YESTERDAY,
      }

      const requestObject = plainToInstance(SelectDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
