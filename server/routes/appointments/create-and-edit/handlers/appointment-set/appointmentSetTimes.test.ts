import { Request, Response } from 'express'
import { addDays } from 'date-fns'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import AppointmentSetTimesRoutes, { AppointmentTimes } from './appointmentSetTimes'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import SimpleTime from '../../../../../commonValidationTypes/simpleTime'
import { simpleDateFromDate } from '../../../../../commonValidationTypes/simpleDate'

const yesterday = addDays(new Date(), -1)
const tomorrow = addDays(new Date(), 1)

describe('Route Handlers - Create Appointment Set - Times', () => {
  const handler = new AppointmentSetTimesRoutes()
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
      addValidationError: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        appointmentJourney: {
          startDate: {
            date: tomorrow,
          },
        },
        appointmentSetJourney: {
          appointments: [
            {
              prisoner: {
                number: 'ABC1234',
              },
              startTime: {
                hour: 12,
                minute: 0,
              },
              endTime: {
                hour: 13,
                minute: 0,
              },
            },
            {
              prisoner: {
                number: 'XYZ4321',
              },
              startTime: {
                hour: 14,
                minute: 30,
              },
              endTime: {
                hour: 15,
                minute: 30,
              },
            },
          ],
        },
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
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/appointment-set/times', {
        appointments: req.session.appointmentSetJourney.appointments,
      })
    })
  })

  describe('POST', () => {
    beforeEach(() => {
      const startTime = new Map()
      startTime.set(
        'ABC1234',
        plainToInstance(SimpleTime, {
          hour: 18,
          minute: 0,
        }),
      )
      startTime.set(
        'XYZ4321',
        plainToInstance(SimpleTime, {
          hour: 19,
          minute: 30,
        }),
      )

      const endTime = new Map()
      endTime.set(
        'ABC1234',
        plainToInstance(SimpleTime, {
          hour: 19,
          minute: 0,
        }),
      )
      endTime.set(
        'XYZ4321',
        plainToInstance(SimpleTime, {
          hour: 20,
          minute: 30,
        }),
      )

      req.body = { startTime, endTime }

      req.session.appointmentJourney.startDate.date = tomorrow
    })

    it('should fail validation if start time is in the past', async () => {
      const startDate = simpleDateFromDate(yesterday)
      req.session.appointmentJourney.startDate = {
        date: startDate.toRichDate(),
        year: startDate.year,
        month: startDate.month,
        day: startDate.day,
      }

      await handler.POST(req, res)

      expect(res.addValidationError).toHaveBeenCalledWith(
        `startTime-ABC1234`,
        'Select a start time that is in the future',
      )
      expect(res.addValidationError).toHaveBeenCalledWith(
        `startTime-XYZ4321`,
        'Select a start time that is in the future',
      )
    })

    it('should fail validation if end time is the same or before start time', async () => {
      const endTime = new Map()
      endTime.set(
        'ABC1234',
        plainToInstance(SimpleTime, {
          hour: 18,
          minute: 0,
        }),
      )
      endTime.set(
        'XYZ4321',
        plainToInstance(SimpleTime, {
          hour: 1,
          minute: 30,
        }),
      )

      req.body.endTime = endTime

      await handler.POST(req, res)

      expect(res.addValidationError).toHaveBeenCalledWith(`endTime-ABC1234`, 'Select an end time after the start time')
      expect(res.addValidationError).toHaveBeenCalledWith(`endTime-XYZ4321`, 'Select an end time after the start time')
    })

    it('should update and save start time and end time in session and redirect to extra information page', async () => {
      await handler.POST(req, res)

      expect(req.session.appointmentSetJourney.appointments).toEqual([
        {
          prisoner: {
            number: 'ABC1234',
          },
          startTime: {
            hour: 18,
            minute: 0,
          },
          endTime: {
            hour: 19,
            minute: 0,
          },
        },
        {
          prisoner: {
            number: 'XYZ4321',
          },
          startTime: {
            hour: 19,
            minute: 30,
          },
          endTime: {
            hour: 20,
            minute: 30,
          },
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('schedule')
    })

    it('should update and save start time and end time in session and redirect to extra information page with preserve history', async () => {
      req.query = { preserveHistory: 'true' }

      await handler.POST(req, res)

      expect(req.session.appointmentSetJourney.appointments).toEqual([
        {
          prisoner: {
            number: 'ABC1234',
          },
          startTime: {
            hour: 18,
            minute: 0,
          },
          endTime: {
            hour: 19,
            minute: 0,
          },
        },
        {
          prisoner: {
            number: 'XYZ4321',
          },
          startTime: {
            hour: 19,
            minute: 30,
          },
          endTime: {
            hour: 20,
            minute: 30,
          },
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('schedule?preserveHistory=true')
    })
  })

  describe('Validation', () => {
    it('validation fails when no start time hour specified', async () => {
      const body = {
        startTime: {
          ABC1234: {
            hour: null as number,
            minute: 0,
          },
        },
      }

      const requestObject = plainToInstance(AppointmentTimes, body)
      const errors = await validate(requestObject).then(errs =>
        errs[0].children[0].children.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual(expect.arrayContaining([{ error: 'Select an hour', property: 'hour' }]))
    })

    it('validation fails when no start time minute specified', async () => {
      const body = {
        startTime: {
          ABC1234: {
            hour: 12,
            minute: null as number,
          },
        },
      }

      const requestObject = plainToInstance(AppointmentTimes, body)
      const errors = await validate(requestObject).then(errs =>
        errs[0].children[0].children.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual(expect.arrayContaining([{ error: 'Select a minute', property: 'minute' }]))
    })

    it('validation fails when no end time hour specified', async () => {
      const body = {
        endTime: {
          ABC1234: {
            hour: null as number,
            minute: 0,
          },
        },
      }

      const requestObject = plainToInstance(AppointmentTimes, body)
      const errors = await validate(requestObject).then(errs =>
        errs[0].children[0].children.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual(expect.arrayContaining([{ error: 'Select an hour', property: 'hour' }]))
    })

    it('validation fails when no end time minute specified', async () => {
      const body = {
        endTime: {
          ABC1234: {
            hour: 12,
            minute: null as number,
          },
        },
      }

      const requestObject = plainToInstance(AppointmentTimes, body)
      const errors = await validate(requestObject).then(errs =>
        errs[0].children[0].children.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual(expect.arrayContaining([{ error: 'Select a minute', property: 'minute' }]))
    })
  })
})
