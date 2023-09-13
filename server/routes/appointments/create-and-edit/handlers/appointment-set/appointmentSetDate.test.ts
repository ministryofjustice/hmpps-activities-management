import { Request, Response } from 'express'
import { addDays, subDays } from 'date-fns'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import AppointmentSetDateRoutes, { AppointmentSetDate } from './appointmentSetDate'
import { simpleDateFromDate } from '../../../../../commonValidationTypes/simpleDate'
import { associateErrorsWithProperty } from '../../../../../utils/utils'

const tomorrow = addDays(new Date(), 1)

describe('Route Handlers - Create Appointment Set - Date', () => {
  const handler = new AppointmentSetDateRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'test.user',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        appointmentJourney: {},
      },
      query: {},
      flash: jest.fn(),
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the date and time view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/appointment-set/date')
    })
  })

  describe('POST', () => {
    it('should save start date, start time and end time in session and redirect to repeat page', async () => {
      const startDate = simpleDateFromDate(tomorrow)

      req.body = {
        startDate,
      }

      await handler.POST(req, res)

      expect(req.session.appointmentJourney.startDate).toEqual({
        day: startDate.day,
        month: startDate.month,
        year: startDate.year,
        date: req.body.startDate.toRichDate(),
      })
      expect(res.redirectOrReturn).toHaveBeenCalledWith(`appointment-set-times`)
    })

    it('should populate return to with schedule', async () => {
      req.query = { preserveHistory: 'true' }
      const startDate = simpleDateFromDate(tomorrow)
      req.body = {
        startDate,
      }
      await handler.POST(req, res)
      expect(req.session.returnTo).toEqual('schedule?preserveHistory=true')
    })
  })

  describe('Validation', () => {
    it('validation fails when no date specified', async () => {
      const body = {}

      const requestObject = plainToInstance(AppointmentSetDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          { error: 'Enter a valid date for the appointment', property: 'startDate' },
          { error: 'Enter a date for the appointment', property: 'startDate' },
        ]),
      )
    })

    it('validation fails when start date is in the past', async () => {
      const yesterday = subDays(new Date(), 1)
      const body = {
        startDate: simpleDateFromDate(yesterday),
      }

      const requestObject = plainToInstance(AppointmentSetDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ error: "Enter a date on or after today's date", property: 'startDate' }]),
      )
    })
  })
})
