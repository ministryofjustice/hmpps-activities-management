import { Request, Response } from 'express'
import { addDays } from 'date-fns'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import SelectDateRoutes, { DateOptions, NotAttendedDate } from './notAttendedSelectDate'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import { formatDatePickerDate, formatIsoDate } from '../../../../utils/datePickerUtils'

describe('Not attended routes - select date', () => {
  const handler = new SelectDateRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          activeCaseLoadId: 'MDI',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = { session: {} } as unknown as Request
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/daily-attendance-summary/select-period', {
        title: 'Not attended yet list: select a date',
      })
    })
  })

  describe('POST', () => {
    it('sets attendanceSummaryJourney to null', async () => {
      req.session.attendanceSummaryJourney = {}
      req.body = {
        datePresetOption: 'today',
      }

      await handler.POST(req, res)

      expect(req.session.attendanceSummaryJourney).toEqual(null)
    })

    it("redirects to not attended list with today's date", async () => {
      const today = new Date()

      req.body = {
        datePresetOption: DateOptions.TODAY,
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        `attendance?date=${formatIsoDate(today)}&status=NotAttended&preserveHistory=true`,
      )
    })

    it("redirects to not attended list with yesterdays's date", async () => {
      const yesterday = addDays(new Date(), -1)

      req.body = {
        datePresetOption: DateOptions.YESTERDAY,
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        `attendance?date=${formatIsoDate(yesterday)}&status=NotAttended&preserveHistory=true`,
      )
    })

    it('redirects to not attended list with correct date', async () => {
      const selectedDate = addDays(new Date(), 2)

      req.body = {
        datePresetOption: DateOptions.OTHER,
        date: selectedDate,
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        `attendance?date=${formatIsoDate(selectedDate)}&status=NotAttended&preserveHistory=true`,
      )
    })
  })

  describe('DateAndLocation type validation', () => {
    it('validation fails if values are not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(NotAttendedDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'datePresetOption', error: 'Select a date' }])
    })

    it('validation fails if invalid values are entered', async () => {
      const body = {
        datePresetOption: 'invalid',
      }

      const requestObject = plainToInstance(NotAttendedDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'datePresetOption', error: 'Select a date' }])
    })

    it('validation fails if date option is other and a date is not provided', async () => {
      const body = {
        datePresetOption: DateOptions.OTHER,
        date: '',
      }

      const requestObject = plainToInstance(NotAttendedDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toContainEqual({ property: 'date', error: 'Enter a valid date' })
    })

    it('validation fails if preset option is other and a bad date is provided', async () => {
      const body = {
        datePresetOption: DateOptions.OTHER,
        date: '',
      }

      const requestObject = plainToInstance(NotAttendedDate, body)
      const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
        errs.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
    })

    it('validation fails if date is more than 60 days into the future', async () => {
      const body = {
        datePresetOption: DateOptions.OTHER,
        date: formatDatePickerDate(addDays(new Date(), 61)),
      }

      const requestObject = plainToInstance(NotAttendedDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'date', error: 'Enter a date up to 60 days in the future' }])
    })

    it('validation fails if date is more than 14 days into the past', async () => {
      const body = {
        datePresetOption: DateOptions.OTHER,
        date: formatDatePickerDate(addDays(new Date(), -15)),
      }

      const requestObject = plainToInstance(NotAttendedDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'date', error: 'Enter a date within the last 14 days' }])
    })

    it('validation passes if validate date option selected', async () => {
      const body = {
        datePresetOption: DateOptions.TODAY,
      }

      const requestObject = plainToInstance(NotAttendedDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('validation passes if validate date option is other and valid date entered', async () => {
      const body = {
        datePresetOption: DateOptions.OTHER,
        date: formatDatePickerDate(addDays(new Date(), -14)),
      }

      const requestObject = plainToInstance(NotAttendedDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
