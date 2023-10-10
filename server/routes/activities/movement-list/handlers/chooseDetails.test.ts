import { Request, Response } from 'express'
import { addDays, addWeeks, format } from 'date-fns'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import ChooseDetailsRoutes, { DateAndTimeSlot } from './chooseDetails'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import DateOption from '../../../../enum/dateOption'
import TimeSlot from '../../../../enum/timeSlot'
import { formatDatePickerDate } from '../../../../utils/datePickerUtils'

describe('Movement list routes - choose details', () => {
  const handler = new ChooseDetailsRoutes()
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

    req = {} as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('renders the expected view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/movement-list/choose-details')
    })
  })

  describe('POST', () => {
    it('redirects with today date option and am time slot', async () => {
      req.body = {
        dateOption: DateOption.TODAY,
        timeSlot: TimeSlot.AM,
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`locations?dateOption=${DateOption.TODAY}&timeSlot=${TimeSlot.AM}`)
    })

    it('redirects with tomorrow date option and pm time slot', async () => {
      req.body = {
        dateOption: DateOption.TOMORROW,
        timeSlot: TimeSlot.PM,
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`locations?dateOption=${DateOption.TOMORROW}&timeSlot=${TimeSlot.PM}`)
    })

    it('redirects with other date option entered date and ed time slot', async () => {
      const nextWeek = addWeeks(new Date(), 1)

      req.body = {
        dateOption: DateOption.OTHER,
        date: nextWeek,
        timeSlot: TimeSlot.ED,
      }

      const expectedDateValue = format(nextWeek, 'yyyy-MM-dd')

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        `locations?dateOption=${DateOption.OTHER}&date=${expectedDateValue}&timeSlot=${TimeSlot.ED}`,
      )
    })
  })

  describe('Validation', () => {
    it('validation fails if values are not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(DateAndTimeSlot, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'dateOption', error: 'Select a date for the movement list' },
        { property: 'timeSlot', error: 'Select a time slot' },
      ])
    })

    it('validation fails if invalid values are entered', async () => {
      const body = {
        dateOption: 'invalid',
        timeSlot: 'invalid',
      }

      const requestObject = plainToInstance(DateAndTimeSlot, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'dateOption', error: 'Select a date for the movement list' },
        { property: 'timeSlot', error: 'Select a time slot' },
      ])
    })

    it('validation fails if date option is other and a date is not provided', async () => {
      const body = {
        dateOption: DateOption.OTHER,
        date: {},
        timeSlot: TimeSlot.AM,
      }

      const requestObject = plainToInstance(DateAndTimeSlot, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
    })

    it('validation fails if date option is other and an invalid date is provided', async () => {
      const body = {
        dateOption: DateOption.OTHER,
        date: { day: 31, month: 2, year: 2022 },
        timeSlot: TimeSlot.PM,
      }

      const requestObject = plainToInstance(DateAndTimeSlot, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
    })

    it('validation fails if date is more than 60 days into the future', async () => {
      const dateIn61Days = addDays(new Date(), 61)
      const body = {
        dateOption: DateOption.OTHER,
        date: formatDatePickerDate(dateIn61Days),
        timeSlot: TimeSlot.ED,
      }

      const requestObject = plainToInstance(DateAndTimeSlot, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'date', error: 'Enter a date up to 60 days in the future' }])
    })

    it('passes validation if date equal to 60 days in the future', async () => {
      const dateIn60Days = addDays(new Date(), 60)
      const body = {
        dateOption: DateOption.OTHER,
        date: formatDatePickerDate(dateIn60Days),
        timeSlot: TimeSlot.AM,
      }

      const requestObject = plainToInstance(DateAndTimeSlot, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('passes validation if date option is today', async () => {
      const body = {
        dateOption: DateOption.TODAY,
        timeSlot: TimeSlot.PM,
      }

      const requestObject = plainToInstance(DateAndTimeSlot, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('passes validation if date option is tomorrow', async () => {
      const body = {
        dateOption: DateOption.TOMORROW,
        timeSlot: TimeSlot.ED,
      }

      const requestObject = plainToInstance(DateAndTimeSlot, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
