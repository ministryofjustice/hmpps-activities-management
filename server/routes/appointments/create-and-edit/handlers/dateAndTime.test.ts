import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, addHours, subDays, subHours } from 'date-fns'
import DateAndTimeRoutes, { DateAndTime, retrospectiveAppointment, maximumRetrospectiveDate } from './dateAndTime'
import SimpleTime from '../../../../commonValidationTypes/simpleTime'
import { associateErrorsWithProperty, formatDate } from '../../../../utils/utils'
import { AppointmentJourney, AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import { EditAppointmentJourney } from '../editAppointmentJourney'
import { ServiceUser } from '../../../../@types/express'
import { formatDatePickerDate, formatIsoDate } from '../../../../utils/datePickerUtils'
import { YesNo } from '../../../../@types/activities'

jest.mock('../../../../services/editAppointmentService')

const tomorrow = addDays(new Date(), 1)
const fiveDaysAgo = subDays(new Date(), 5)
const user = { activeCaseLoadId: 'MDI', username: 'USER1', displayName: 'John Smith' } as ServiceUser

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
    beforeEach(() => {
      req.session.appointmentJourney.mode = AppointmentJourneyMode.CREATE
    })

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
      expect(req.session.appointmentJourney.retrospective).toBe(YesNo.NO)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('repeat')
    })

    it('should populate return to with check-answers for a retrospective appointment 5 days in the past', async () => {
      req.body = {
        startDate: fiveDaysAgo,
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
      expect(req.session.appointmentJourney.startDate).toEqual(formatIsoDate(fiveDaysAgo))
      expect(req.session.appointmentJourney.startTime).toEqual({
        hour: 11,
        minute: 30,
        date: req.body.startTime.toDate(fiveDaysAgo),
      })
      expect(req.session.appointmentJourney.endTime).toEqual({
        hour: 13,
        minute: 0,
        date: req.body.endTime.toDate(fiveDaysAgo),
      })
      expect(req.session.appointmentJourney.retrospective).toBe(YesNo.YES)
      expect(req.session.appointmentJourney.repeat).toEqual(YesNo.NO)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('check-answers')
    })
  })

  it('should populate return to with schedule', async () => {
    req.query = { preserveHistory: 'true' }
    req.body = {
      startDate: formatIsoDate(tomorrow),
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

  describe('COPY', () => {
    beforeEach(() => {
      req.body = {
        startDate: tomorrow,
      }
      req.session.appointmentJourney = {
        type: AppointmentType.INDIVIDUAL,
        mode: AppointmentJourneyMode.COPY,
        startTime: {
          hour: 10,
          minute: 5,
          date: undefined,
        },
        endTime: {
          hour: 11,
          minute: 24,
          date: undefined,
        },
      }
    })

    it('should populate return to with schedule when copying a single appointment', async () => {
      await handler.CREATE(req, res)

      expect(req.session.appointmentJourney.startDate).toEqual(formatIsoDate(tomorrow))
      expect(req.session.appointmentJourney.startTime).toEqual({
        hour: 10,
        minute: 5,
        date: plainToInstance(SimpleTime, { hour: 10, minute: 5 }).toDate(tomorrow),
      })
      expect(req.session.appointmentJourney.endTime).toEqual({
        hour: 11,
        minute: 24,
        date: plainToInstance(SimpleTime, { hour: 11, minute: 24 }).toDate(tomorrow),
      })
      expect(res.redirectOrReturn).toHaveBeenCalledWith('schedule')
    })

    it('should populate return to with copy-series when copying a future series', async () => {
      req.session.appointmentJourney.repeat = YesNo.YES

      await handler.CREATE(req, res)

      expect(req.session.appointmentJourney.startDate).toEqual(formatIsoDate(tomorrow))
      expect(req.session.appointmentJourney.startTime).toEqual({
        hour: 10,
        minute: 5,
        date: plainToInstance(SimpleTime, { hour: 10, minute: 5 }).toDate(tomorrow),
      })
      expect(req.session.appointmentJourney.endTime).toEqual({
        hour: 11,
        minute: 24,
        date: plainToInstance(SimpleTime, { hour: 11, minute: 24 }).toDate(tomorrow),
      })
      expect(res.redirectOrReturn).toHaveBeenCalledWith('copy-series')
    })

    it('should populate return to with check-answers when copying a retrospective series', async () => {
      req.session.appointmentJourney.repeat = YesNo.YES
      req.body.startDate = fiveDaysAgo

      await handler.CREATE(req, res)

      expect(req.session.appointmentJourney.startDate).toEqual(formatIsoDate(fiveDaysAgo))
      expect(req.session.appointmentJourney.startTime).toEqual({
        hour: 10,
        minute: 5,
        date: plainToInstance(SimpleTime, { hour: 10, minute: 5 }).toDate(fiveDaysAgo),
      })
      expect(req.session.appointmentJourney.endTime).toEqual({
        hour: 11,
        minute: 24,
        date: plainToInstance(SimpleTime, { hour: 11, minute: 24 }).toDate(fiveDaysAgo),
      })
      expect(res.redirectOrReturn).toHaveBeenCalledWith('check-answers')
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

    it('should update the appointment date and redirect to schedule when the start date is 5 days ago', async () => {
      req.body.startDate = fiveDaysAgo

      await handler.EDIT(req, res)

      expect(req.session.editAppointmentJourney.startDate).toEqual(formatIsoDate(fiveDaysAgo))
      expect(res.redirect).toHaveBeenCalledWith('schedule')
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
    describe('CREATE / EDIT', () => {
      it.each([{ mode: AppointmentJourneyMode.CREATE }, { mode: AppointmentJourneyMode.EDIT }])(
        'validation fails when no date or times are specified and mode is $mode',
        async ({ mode }) => {
          const body = {
            appointmentJourney: {
              mode,
            },
          }

          const requestObject = plainToInstance(DateAndTime, body)
          const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

          expect(errors).toEqual(
            expect.arrayContaining([
              { error: 'Enter a date for the appointment', property: 'startDate' },
              { error: 'Select a start time for the appointment', property: 'startTime' },
              { error: 'Select an end time for the appointment', property: 'endTime' },
            ]),
          )
        },
      )

      it.each([{ mode: AppointmentJourneyMode.CREATE }, { mode: AppointmentJourneyMode.EDIT }])(
        'validation fails when start date is more than 5 days in the past and mode is $mode',
        async ({ mode }) => {
          const sixDaysAgo = subDays(new Date(), 6)
          const sixDaysAgoFormatted = formatDate(sixDaysAgo, 'd MMMM yyyy')
          const body = {
            appointmentJourney: {
              mode,
            },
            startDate: formatDatePickerDate(sixDaysAgo),
            startTime: plainToInstance(SimpleTime, {
              hour: 11,
              minute: 30,
            }),
            endTime: plainToInstance(SimpleTime, {
              hour: 11,
              minute: 45,
            }),
          }

          const requestObject = plainToInstance(DateAndTime, body)
          const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

          expect(errors).toEqual(
            expect.arrayContaining([
              {
                error: `Enter a date that's after ${sixDaysAgoFormatted}`,
                property: 'startDate',
              },
            ]),
          )
        },
      )

      it.each([{ mode: AppointmentJourneyMode.CREATE }, { mode: AppointmentJourneyMode.EDIT }])(
        'validation fails when end time is not after the start time and mode is $mode',
        async ({ mode }) => {
          const body = {
            appointmentJourney: {
              mode,
            },
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
        },
      )
    })

    describe('COPY', () => {
      it('validation fails when no date is specified', async () => {
        const body = {
          appointmentJourney: {
            mode: AppointmentJourneyMode.COPY,
          },
        }

        const requestObject = plainToInstance(DateAndTime, body)
        const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

        expect(errors).toEqual(
          expect.arrayContaining([{ error: 'Enter a date for the appointment', property: 'startDate' }]),
        )
      })

      it('validation succeeds without times', async () => {
        const body = {
          appointmentJourney: {
            mode: AppointmentJourneyMode.COPY,
          },
          startDate: formatDatePickerDate(tomorrow),
        }

        const requestObject = plainToInstance(DateAndTime, body)
        const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

        expect(errors).toHaveLength(0)
      })
    })
  })
})

describe('Retrospective - Appointment Journey - Date and Time', () => {
  it('should return correct earliest date', async () => {
    const aDate = new Date('December 17, 2023 03:24:00')
    const formattedDate = maximumRetrospectiveDate(aDate, 5)

    expect(formattedDate).toEqual('12 December 2023')
  })

  it('should return true for an appointment in the past', async () => {
    const pastTime = subHours(new Date(), 1)
    const startTime = {
      hour: pastTime.getHours(),
      minute: pastTime.getMinutes(),
      date: pastTime,
    }

    const isRetrospective = retrospectiveAppointment(startTime)
    expect(isRetrospective).toBe(true)
  })

  it('should return false for an appointment in the future', async () => {
    const futureTime = addHours(new Date(), 1)
    const startTime = {
      hour: futureTime.getHours(),
      minute: futureTime.getMinutes(),
      date: futureTime,
    }

    const isRetrospective = retrospectiveAppointment(startTime)
    expect(isRetrospective).toBe(false)
  })
})
