import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { addDays, addHours, getHours, getMinutes, subDays, subMinutes } from 'date-fns'
import DateAndTimeRoutes, { DateAndTime } from './dateAndTime'
import { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'
import SimpleTime, { simpleTimeFromDate } from '../../../../commonValidationTypes/simpleTime'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import { AppointmentJourney } from '../appointmentJourney'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create Appointment - Date and Time', () => {
  const handler = new DateAndTimeRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirectOrReturn: jest.fn(),
      validationFailed: jest.fn(),
      locals: {},
    } as unknown as Response

    req = {
      session: {
        appointmentJourney: {},
      },
      flash: jest.fn(),
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the date and time view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/date-and-time')
    })
  })

  describe('CREATE', () => {
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

      await handler.CREATE(req, res)

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

  describe('EDIT', () => {
    beforeEach(() => {
      req.params = {
        appointmentId: '2',
        occurrenceId: '12',
      }

      req.session.appointmentJourney = {
        startDate: {
          day: 23,
          month: 4,
          year: 2023,
          date: '2023-04-23T00:00:00.000+0100',
        },
        startTime: {
          hour: 9,
          minute: 30,
          date: '2023-04-23T09:30:00.000+0100',
        },
        endTime: {
          hour: 13,
          minute: 0,
          date: '2023-04-23T13:00:00.000+0100',
        },
      } as unknown as AppointmentJourney
    })

    it('should update the date and time then redirect back to the occurrence details page', async () => {
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

      when(activitiesService.editAppointmentOccurrence).calledWith(atLeast(12))

      await handler.EDIT(req, res)

      expect(req.flash).toHaveBeenCalledWith(
        'successMessage',
        JSON.stringify({
          message: `Appointment date and start time for this occurrence changed successfully`,
        }),
      )

      expect(res.redirectOrReturn).toHaveBeenCalledWith('/appointments/2/occurrence/12')
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
