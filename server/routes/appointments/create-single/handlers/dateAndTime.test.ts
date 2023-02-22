import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { getDate, getHours, getMinutes, getMonth, getYear } from 'date-fns'
import DateAndTimeRoutes, { DateAndTime } from './dateAndTime'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import SimpleTime from '../../../../commonValidationTypes/simpleTime'
import { associateErrorsWithProperty } from '../../../../utils/utils'

describe('Route Handlers - Create Single Appointment - Date and Time', () => {
  const handler = new DateAndTimeRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createSingleAppointmentJourney: {},
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the date and time view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-single/date-and-time')
    })
  })

  describe('POST', () => {
    it('should save start date, start time and end time in session and redirect to check answers page', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(getDate(tomorrow) + 1)

      req.body = {
        startDate: plainToInstance(SimpleDate, {
          day: getDate(tomorrow),
          month: getMonth(tomorrow) + 1,
          year: getYear(tomorrow),
        }),
        startTime: plainToInstance(SimpleTime, {
          hour: 11,
          minute: 30,
        }),
        endTime: plainToInstance(SimpleTime, {
          hour: 13,
          minute: 0,
        }),
      }

      await handler.POST(req, res)

      expect(req.session.createSingleAppointmentJourney.startDate).toEqual({
        day: getDate(tomorrow),
        month: getMonth(tomorrow) + 1,
        year: getYear(tomorrow),
        date: req.body.startDate.toRichDate(),
      })
      expect(req.session.createSingleAppointmentJourney.startTime).toEqual({
        hour: 11,
        minute: 30,
        date: req.body.startTime.toDate(tomorrow),
      })
      expect(req.session.createSingleAppointmentJourney.endTime).toEqual({
        hour: 13,
        minute: 0,
        date: req.body.endTime.toDate(tomorrow),
      })
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
  })

  describe('Validation', () => {
    it('validation fails when no date or times are specified', async () => {
      const body = {}

      const requestObject = plainToInstance(DateAndTime, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          { error: 'Enter a valid date for the appointment', property: 'startDate' },
          { error: 'Enter a date for the appointment', property: 'startDate' },
          { error: 'Select a valid start time for the appointment', property: 'startTime' },
          { error: 'Select a start time for the appointment', property: 'startTime' },
          { error: 'Select a valid end time for the appointment', property: 'endTime' },
          { error: 'Select an end time for the appointment', property: 'endTime' },
        ]),
      )
    })

    it('validation fails when start date is in the past', async () => {
      const today = new Date()
      const body = {
        startDate: plainToInstance(SimpleDate, {
          day: getDate(today) - 1,
          month: getMonth(today) + 1,
          year: getYear(today),
        }),
        startTime: plainToInstance(SimpleTime, {
          hour: 11,
          minute: 30,
        }),
        endTime: plainToInstance(SimpleTime, {
          hour: 13,
          minute: 0,
        }),
      }

      const requestObject = plainToInstance(DateAndTime, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ error: "Enter a date on or after today's date", property: 'startDate' }]),
      )
    })
  })

  it('validation fails when start time is in the past', async () => {
    const today = new Date()
    const body = {
      startDate: plainToInstance(SimpleDate, {
        day: getDate(today),
        month: getMonth(today) + 1,
        year: getYear(today),
      }),
      startTime: plainToInstance(SimpleTime, {
        hour: getHours(today),
        minute: getMinutes(today) - 1,
      }),
      endTime: plainToInstance(SimpleTime, {
        hour: getHours(today) + 1,
        minute: getMinutes(today),
      }),
    }

    const requestObject = plainToInstance(DateAndTime, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual(
      expect.arrayContaining([{ error: 'Start time must be in the future', property: 'startTime' }]),
    )
  })

  it('validation fails when end time after the start time', async () => {
    const today = new Date()
    const body = {
      startDate: plainToInstance(SimpleDate, {
        day: getDate(today) + 1,
        month: getMonth(today) + 1,
        year: getYear(today),
      }),
      startTime: plainToInstance(SimpleTime, {
        hour: 11,
        minute: 30,
      }),
      endTime: plainToInstance(SimpleTime, {
        hour: 11,
        minute: 30,
      }),
    }

    const requestObject = plainToInstance(DateAndTime, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual(
      expect.arrayContaining([{ error: 'Select an end time after the start time', property: 'endTime' }]),
    )
  })
})
