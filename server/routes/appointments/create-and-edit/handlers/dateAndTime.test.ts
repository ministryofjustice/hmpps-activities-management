import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, addHours, getHours, getMinutes, subDays, subMinutes } from 'date-fns'
import DateAndTimeRoutes, { DateAndTime } from './dateAndTime'
import { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'
import SimpleTime, { simpleTimeFromDate } from '../../../../commonValidationTypes/simpleTime'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import { AppointmentJourney, AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import { EditAppointmentJourney } from '../editAppointmentJourney'
import { ServiceUser } from '../../../../@types/express'

jest.mock('../../../../services/editAppointmentService')

const tomorrow = addDays(new Date(), 1)
const user = { activeCaseLoadId: 'MDI', username: 'USER1', firstName: 'John', lastName: 'Smith' } as ServiceUser

describe('Route Handlers - Appointment Journey - Date and Time', () => {
  const handler = new DateAndTimeRoutes()
  let req: Request
  let res: Response
  const appointmentId = '1'
  const occurrenceId = '2'

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
      redirectWithSuccess: jest.fn(),
      validationFailed: jest.fn(),
      locals: {
        user,
      },
    } as unknown as Response

    req = {
      session: {
        appointmentJourney: {},
        editAppointmentJourney: {},
      },
      query: {},
    } as unknown as Request

    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the date and time view with back to name and continue', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/date-and-time', {
        backLinkHref: 'location',
      })
    })

    it('should render the date and time view with back to occurrence details', async () => {
      req.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT
      req.params = {
        appointmentId,
        occurrenceId,
      }

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/date-and-time', {
        backLinkHref: `/appointments/${appointmentId}`,
      })
    })
  })

  describe('CREATE', () => {
    it('should save start date, start time and end time in session and redirect to repeat page', async () => {
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

    it('should populate return to with schedule', async () => {
      req.query = { preserveHistory: 'true' }
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
      expect(req.session.returnTo).toEqual('schedule?preserveHistory=true')
    })
  })

  describe('EDIT', () => {
    beforeEach(() => {
      req.params = {
        appointmentId: '2',
        occurrenceId: '12',
      }

      req.session.appointmentJourney = {
        startDate: simpleDateFromDate(tomorrow),
        startTime: plainToInstance(SimpleTime, {
          hour: 9,
          minute: 30,
        }),
        endTime: plainToInstance(SimpleTime, {
          hour: 13,
          minute: 0,
        }),
      } as unknown as AppointmentJourney

      req.session.editAppointmentJourney = {} as unknown as EditAppointmentJourney

      req.body = {
        startDate: simpleDateFromDate(tomorrow),
        startTime: plainToInstance(SimpleTime, {
          hour: 9,
          minute: 30,
        }),
        endTime: plainToInstance(SimpleTime, {
          hour: 13,
          minute: 0,
        }),
      } as unknown as AppointmentJourney
    })

    it('should update the occurrence date and redirect to schedule', async () => {
      const nextWeek = simpleDateFromDate(addDays(new Date(), 7))
      req.body.startDate = nextWeek

      await handler.EDIT(req, res)

      expect(req.session.editAppointmentJourney.startDate).toEqual({
        day: nextWeek.day,
        month: nextWeek.month,
        year: nextWeek.year,
        date: nextWeek.toRichDate(),
      })
      expect(res.redirect).toHaveBeenCalledWith('schedule')
    })

    it('should update the occurrence start time and end time and redirect to schedule', async () => {
      const startTime = plainToInstance(SimpleTime, {
        hour: 10,
        minute: 30,
      })
      const endTime = plainToInstance(SimpleTime, {
        hour: 14,
        minute: 0,
      })

      req.body.startTime = startTime
      req.body.endTime = endTime

      await handler.EDIT(req, res)

      expect(req.session.editAppointmentJourney.startTime).toEqual({
        hour: startTime.hour,
        minute: startTime.minute,
        date: startTime.toDate(tomorrow),
      })
      expect(req.session.editAppointmentJourney.endTime).toEqual({
        hour: endTime.hour,
        minute: endTime.minute,
        date: endTime.toDate(tomorrow),
      })
      expect(res.redirect).toHaveBeenCalledWith('schedule')
    })

    it('should update the occurrence date, start time and end time and redirect to schedule', async () => {
      const nextWeek = simpleDateFromDate(addDays(new Date(), 7))
      const startTime = plainToInstance(SimpleTime, {
        hour: 10,
        minute: 30,
      })
      const endTime = plainToInstance(SimpleTime, {
        hour: 14,
        minute: 0,
      })

      req.body.startDate = nextWeek
      req.body.startTime = startTime
      req.body.endTime = endTime

      await handler.EDIT(req, res)

      expect(req.session.editAppointmentJourney.startDate).toEqual({
        day: nextWeek.day,
        month: nextWeek.month,
        year: nextWeek.year,
        date: nextWeek.toRichDate(),
      })
      expect(req.session.editAppointmentJourney.startTime).toEqual({
        hour: startTime.hour,
        minute: startTime.minute,
        date: startTime.toDate(nextWeek.toRichDate()),
      })
      expect(req.session.editAppointmentJourney.endTime).toEqual({
        hour: endTime.hour,
        minute: endTime.minute,
        date: endTime.toDate(nextWeek.toRichDate()),
      })
      expect(res.redirect).toHaveBeenCalledWith('schedule')
    })

    it('should clear the journey and redirect back to occurrence page if no changes are made', async () => {
      const nextWeek = simpleDateFromDate(addDays(new Date(), 7))
      const startTime = plainToInstance(SimpleTime, {
        hour: 10,
        minute: 30,
      })
      const endTime = plainToInstance(SimpleTime, {
        hour: 14,
        minute: 0,
      })

      req.body.startDate = nextWeek
      req.body.startTime = startTime
      req.body.endTime = endTime

      req.session.appointmentJourney = {
        type: AppointmentType.GROUP,
        mode: AppointmentJourneyMode.EDIT,
        startDate: {
          ...nextWeek,
          date: nextWeek.toRichDate(),
        },
        startTime: {
          ...startTime,
          date: nextWeek.toRichDate(),
        },
        endTime: {
          ...endTime,
          date: nextWeek.toRichDate(),
        },
      }

      await handler.EDIT(req, res)

      expect(req.session.editAppointmentJourney).toBeNull()
      expect(req.session.appointmentJourney).toBeNull()
      expect(res.redirect).toHaveBeenCalledWith(`/appointments/12`)
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
