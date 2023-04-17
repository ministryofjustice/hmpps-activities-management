import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, addHours, getHours, getMinutes, subDays, subMinutes } from 'date-fns'
import DateAndTimeRoutes, { DateAndTime } from './dateAndTime'
import { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'
import SimpleTime, { simpleTimeFromDate } from '../../../../commonValidationTypes/simpleTime'
import { associateErrorsWithProperty } from '../../../../utils/utils'

describe('Route Handlers - Create Appointment - Date and Time', () => {
  const handler = new DateAndTimeRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirectOrReturn: jest.fn(),
      locals: {},
    } as unknown as Response

    req = {
      session: {
        appointmentJourney: {},
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the date and time view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/date-and-time')
    })
  })

  describe('POST', () => {
    it('should save start date, start time and end time in session and redirect to repeat page', async () => {
      const tomorrow = addDays(new Date(), 1)
      const startDate = simpleDateFromDate(tomorrow)

      req.body = {
        startDate,
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

      expect(req.session.appointmentJourney.startDate).toEqual({
        day: startDate.day,
        month: startDate.month,
        year: startDate.year,
        date: req.body.startDate.toRichDate(),
      })
      expect(req.session.appointmentJourney.startTime).toEqual({
        hour: 11,
        minute: 30,
        date: req.body.startTime.toDate(tomorrow),
      })
      expect(req.session.appointmentJourney.endTime).toEqual({
        hour: 13,
        minute: 0,
        date: req.body.endTime.toDate(tomorrow),
      })
      expect(res.redirectOrReturn).toHaveBeenCalledWith('repeat')
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
      const yesterday = subDays(new Date(), 1)
      const body = {
        startDate: simpleDateFromDate(yesterday),
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
    // Test will fail if run at midnight
    const now = new Date()
    if (getHours(now) === 0 && getMinutes(now) === 0) {
      return
    }

    const todayOneMinuteInThePast = subMinutes(now, 1)
    const body = {
      startDate: simpleDateFromDate(todayOneMinuteInThePast),
      startTime: simpleTimeFromDate(todayOneMinuteInThePast),
      endTime: simpleTimeFromDate(addHours(todayOneMinuteInThePast, 1)),
    }

    const requestObject = plainToInstance(DateAndTime, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual(
      expect.arrayContaining([{ error: 'Select a start time that is in the future', property: 'startTime' }]),
    )
  })

  it('validation fails when end time is not after the start time', async () => {
    const today = new Date()
    const body = {
      startDate: simpleDateFromDate(today),
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
