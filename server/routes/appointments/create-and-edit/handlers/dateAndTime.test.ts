import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, addHours, getHours, getMinutes, subDays, subMinutes } from 'date-fns'
import DateAndTimeRoutes, { DateAndTime } from './dateAndTime'
import SimpleTime, { simpleTimeFromDate } from '../../../../commonValidationTypes/simpleTime'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import { AppointmentJourney, AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import { EditAppointmentJourney } from '../editAppointmentJourney'
import { ServiceUser } from '../../../../@types/express'
import { formatDatePickerDate, formatIsoDate } from '../../../../utils/datePickerUtils'

jest.mock('../../../../services/editAppointmentService')

const tomorrow = addDays(new Date(), 1)
const user = { activeCaseLoadId: 'MDI', username: 'USER1', firstName: 'John', lastName: 'Smith' } as ServiceUser

describe('Route Handlers - Appointment Journey - Date and Time', () => {
  const handler = new DateAndTimeRoutes()
  let req: Request
  let res: Response

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
    it('should render the date and time view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/date-and-time')
    })
  })

  describe('CREATE', () => {
    it('should save start date, start time and end time in session and redirect to repeat page', async () => {
      req.body = {
        startDate: tomorrow,
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

      expect(req.session.appointmentJourney.startDate).toEqual(formatIsoDate(tomorrow))
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
      req.body = {
        startDate: formatDatePickerDate(tomorrow),
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
        appointmentId: '12',
      }

      req.session.appointmentJourney = {
        startDate: formatIsoDate(tomorrow),
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
        startDate: formatDatePickerDate(tomorrow),
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

    it('should update the appointment date and redirect to schedule', async () => {
      const nextWeek = addDays(new Date(), 7)
      req.body.startDate = nextWeek

      await handler.EDIT(req, res)

      expect(req.session.editAppointmentJourney.startDate).toEqual(formatIsoDate(nextWeek))
      expect(res.redirect).toHaveBeenCalledWith('schedule')
    })

    it('should update the appointment start time and end time and redirect to schedule', async () => {
      const startTime = plainToInstance(SimpleTime, {
        hour: 10,
        minute: 30,
      })
      const endTime = plainToInstance(SimpleTime, {
        hour: 14,
        minute: 0,
      })

      req.body.startDate = tomorrow
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

    it('should update the appointment date, start time and end time and redirect to schedule', async () => {
      const nextWeek = addDays(new Date(), 7)
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

      expect(req.session.editAppointmentJourney.startDate).toEqual(formatIsoDate(nextWeek))
      expect(req.session.editAppointmentJourney.startTime).toEqual({
        hour: startTime.hour,
        minute: startTime.minute,
        date: startTime.toDate(nextWeek),
      })
      expect(req.session.editAppointmentJourney.endTime).toEqual({
        hour: endTime.hour,
        minute: endTime.minute,
        date: endTime.toDate(nextWeek),
      })
      expect(res.redirect).toHaveBeenCalledWith('schedule')
    })

    it('should clear the journey and redirect back to appointment page if no changes are made', async () => {
      const nextWeek = addDays(new Date(), 7)
      const startTime = plainToInstance(SimpleTime, {
        hour: 10,
        minute: 30,
      })
      const endTime = plainToInstance(SimpleTime, {
        hour: 14,
        minute: 0,
      })

      req.body.startDate = formatDatePickerDate(nextWeek)
      req.body.startTime = startTime
      req.body.endTime = endTime

      req.session.appointmentJourney = {
        type: AppointmentType.GROUP,
        mode: AppointmentJourneyMode.EDIT,
        startDate: formatIsoDate(nextWeek),
        startTime: {
          ...startTime,
          date: nextWeek,
        },
        endTime: {
          ...endTime,
          date: nextWeek,
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
          { error: 'Enter a date for the appointment', property: 'startDate' },
          { error: 'Select a start time for the appointment', property: 'startTime' },
          { error: 'Select a valid start time for the appointment', property: 'startTime' },
          { error: 'Select an end time for the appointment', property: 'endTime' },
          { error: 'Select a valid end time for the appointment', property: 'endTime' },
        ]),
      )
    })

    it('validation fails when start date is in the past', async () => {
      const yesterday = subDays(new Date(), 1)
      const body = {
        startDate: formatDatePickerDate(yesterday),
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
      startDate: formatDatePickerDate(todayOneMinuteInThePast),
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
    const body = {
      startDate: formatDatePickerDate(tomorrow),
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
