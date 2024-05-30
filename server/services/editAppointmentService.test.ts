import { Request, Response } from 'express'
import { addDays } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import ActivitiesService from './activitiesService'
import EditAppointmentService from './editAppointmentService'
import MetricsService from './metricsService'
import {
  AppointmentJourney,
  AppointmentJourneyMode,
  AppointmentType,
} from '../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../routes/appointments/create-and-edit/editAppointmentJourney'
import { AppointmentCancellationReason, AppointmentApplyTo } from '../@types/appointments'
import { formatDate, parseDate } from '../utils/utils'
import {
  AppointmentCancelRequest,
  AppointmentUpdateRequest,
  AppointmentSeriesSummary,
  AppointmentSetSummary,
  AppointmentUncancelRequest,
} from '../@types/activitiesAPI/types'
import { YesNo } from '../@types/activities'
import config from '../config'
import MetricsEvent from '../data/metricsEvent'
import { MetricsEventType } from '../@types/metricsEvents'
import { formatIsoDate } from '../utils/datePickerUtils'

jest.mock('./activitiesService')
jest.mock('./metricsService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const metricsService = new MetricsService(null) as jest.Mocked<MetricsService>

describe('Edit Appointment Service', () => {
  const service = new EditAppointmentService(activitiesService, metricsService)
  const weekTomorrow = addDays(new Date(), 8)
  let req: Request
  let res: Response
  const journeyId = uuidv4()
  const appointmentId = 2

  beforeEach(() => {
    req = {
      session: {
        journeyMetrics: {
          journeyStartTime: Date.now() - 60000,
        },
        appointmentJourney: {
          mode: AppointmentJourneyMode.EDIT,
          type: AppointmentType.GROUP,
          category: {
            code: 'TEST',
            description: 'Category',
          },
          appointmentName: 'Category',
          location: {
            id: 1,
            description: 'Location',
          },
          startDate: formatIsoDate(weekTomorrow),
          startTime: {
            hour: 9,
            minute: 30,
            date: weekTomorrow.setHours(9, 30),
          },
          endTime: {
            hour: 13,
            minute: 0,
            date: weekTomorrow.setHours(13, 0),
          },
          repeat: YesNo.NO,
        } as unknown as AppointmentJourney,
        editAppointmentJourney: {
          numberOfAppointments: 4,
          location: {
            id: 1,
            description: 'Location',
          },
          appointments: [
            {
              sequenceNumber: 1,
              startDate: formatDate(weekTomorrow, 'yyyy-MM-dd'),
            },
            {
              sequenceNumber: 2,
              startDate: formatDate(addDays(weekTomorrow, 1), 'yyyy-MM-dd'),
            },
            {
              sequenceNumber: 3,
              startDate: formatDate(addDays(weekTomorrow, 2), 'yyyy-MM-dd'),
            },
            {
              sequenceNumber: 4,
              startDate: formatDate(addDays(weekTomorrow, 3), 'yyyy-MM-dd'),
            },
          ],
          sequenceNumber: 2,
        } as EditAppointmentJourney,
      },
      params: {
        journeyId,
        appointmentId,
      },
      flash: jest.fn(),
    } as unknown as Request

    res = {
      locals: {
        user: {
          username: 'test.user',
          activeCaseLoadId: 'TPR',
        },
      },
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('redirectOrEdit', () => {
    it('when no property has changed', async () => {
      req.session.editAppointmentJourney.property = 'date-and-time'

      await service.redirectOrEdit(req, res, '')

      expect(activitiesService.editAppointment).not.toHaveBeenCalled()
      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
          .addProperty('journeyId', journeyId)
          .addProperty('appointmentId', appointmentId)
          .addProperty('property', 'date-and-time')
          .addProperty('propertyChanged', 'false')
          .addProperty('isApplyToQuestionRequired', 'true')
          .addProperty('applyTo', 'NA')
          .addMeasurement('journeyTimeSec', 60),
      )
      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.editAppointmentJourney).toBeNull()
      expect(req.session.journeyMetrics).toBeNull()
      expect(res.redirect).toHaveBeenCalledWith(`/appointments/${appointmentId}`)
    })

    it('when changing the location for a non repeating appointment', async () => {
      req.session.editAppointmentJourney.appointments = [
        {
          sequenceNumber: 1,
          startDate: formatDate(weekTomorrow, 'yyyy-MM-dd'),
        },
      ]
      req.session.editAppointmentJourney.property = 'location'
      req.session.editAppointmentJourney.location = {
        id: 2,
        description: 'Updated location',
      }

      await service.redirectOrEdit(req, res, 'location')

      expect(activitiesService.editAppointment).toHaveBeenCalledWith(
        2,
        { internalLocationId: 2, applyTo: AppointmentApplyTo.THIS_APPOINTMENT } as AppointmentUpdateRequest,
        res.locals.user,
      )
      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
          .addProperty('journeyId', journeyId)
          .addProperty('appointmentId', appointmentId)
          .addProperty('property', 'location')
          .addProperty('propertyChanged', 'true')
          .addProperty('isApplyToQuestionRequired', 'false')
          .addProperty('applyTo', AppointmentApplyTo.THIS_APPOINTMENT)
          .addMeasurement('journeyTimeSec', 60),
      )
      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.editAppointmentJourney).toBeNull()
      expect(req.session.journeyMetrics).toBeNull()
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `/appointments/${appointmentId}`,
        "You've changed the location for this appointment",
      )
    })

    it('when changing the location for a repeating appointment', async () => {
      req.session.editAppointmentJourney.property = 'location'
      req.session.editAppointmentJourney.location = {
        id: 2,
        description: 'Updated location',
      }

      await service.redirectOrEdit(req, res, 'location')

      expect(activitiesService.editAppointment).not.toHaveBeenCalled()
      expect(metricsService.trackEvent).not.toHaveBeenCalled()
      expect(req.session.appointmentJourney).not.toBeNull()
      expect(req.session.editAppointmentJourney).not.toBeNull()
      expect(req.session.journeyMetrics).not.toBeNull()
      expect(res.redirect).toHaveBeenCalledWith('location/apply-to')
    })
  })

  describe('edit', () => {
    describe('apply to this appointment', () => {
      it('when cancelling', async () => {
        req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CANCELLED

        await service.edit(req, res, AppointmentApplyTo.THIS_APPOINTMENT)

        expect(activitiesService.cancelAppointment).toHaveBeenCalledWith(
          2,
          {
            cancellationReasonId: +AppointmentCancellationReason.CANCELLED,
            applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
          } as AppointmentCancelRequest,
          res.locals.user,
        )
        expect(activitiesService.editAppointment).not.toHaveBeenCalled()
        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.CANCEL_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('isDelete', 'false')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.THIS_APPOINTMENT)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirect).toHaveBeenCalledWith(`/appointments/${appointmentId}`)
      })

      it('when un-cancelling an appointment', async () => {
        req.session.editAppointmentJourney.uncancel = true

        await service.edit(req, res, AppointmentApplyTo.THIS_APPOINTMENT)

        expect(activitiesService.uncancelAppointment).toHaveBeenCalledWith(
          2,
          {
            applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
          } as AppointmentUncancelRequest,
          res.locals.user,
        )
        expect(activitiesService.editAppointment).not.toHaveBeenCalled()
        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.UNCANCEL_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('isDelete', 'false')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.THIS_APPOINTMENT)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirect).toHaveBeenCalledWith(`/appointments/${appointmentId}`)
      })

      it('when deleting', async () => {
        req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CREATED_IN_ERROR

        await service.edit(req, res, AppointmentApplyTo.THIS_APPOINTMENT)

        expect(activitiesService.cancelAppointment).toHaveBeenCalledWith(
          2,
          {
            cancellationReasonId: +AppointmentCancellationReason.CREATED_IN_ERROR,
            applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
          } as AppointmentCancelRequest,
          res.locals.user,
        )
        expect(activitiesService.editAppointment).not.toHaveBeenCalled()
        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.CANCEL_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('isDelete', 'true')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.THIS_APPOINTMENT)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirect).toHaveBeenCalledWith(`/appointments/${appointmentId}`)
      })

      it('when deleting appointment from set', async () => {
        req.session.appointmentJourney.prisoners = [
          {
            number: 'A1111A',
          },
        ] as AppointmentJourney['prisoners']
        req.session.editAppointmentJourney.appointments = [
          {
            sequenceNumber: 1,
            startDate: formatDate(weekTomorrow, 'yyyy-MM-dd'),
          },
        ]
        req.session.editAppointmentJourney.appointmentSet = {
          id: 1,
        } as AppointmentSetSummary
        req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CREATED_IN_ERROR

        await service.edit(req, res, AppointmentApplyTo.THIS_APPOINTMENT)

        expect(activitiesService.cancelAppointment).toHaveBeenCalledWith(
          2,
          {
            cancellationReasonId: +AppointmentCancellationReason.CREATED_IN_ERROR,
            applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
          } as AppointmentCancelRequest,
          res.locals.user,
        )
        expect(activitiesService.editAppointment).not.toHaveBeenCalled()
        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.CANCEL_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('isDelete', 'true')
            .addProperty('isApplyToQuestionRequired', 'false')
            .addProperty('applyTo', AppointmentApplyTo.THIS_APPOINTMENT)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirect).toHaveBeenCalledWith(`/appointments/${appointmentId}`)
      })

      it('when deleting appointment from series', async () => {
        req.session.appointmentJourney.repeat = YesNo.YES
        req.session.editAppointmentJourney.appointmentSeries = {
          id: 1,
        } as AppointmentSeriesSummary
        req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CREATED_IN_ERROR

        await service.edit(req, res, AppointmentApplyTo.THIS_APPOINTMENT)

        expect(activitiesService.cancelAppointment).toHaveBeenCalledWith(
          2,
          {
            cancellationReasonId: +AppointmentCancellationReason.CREATED_IN_ERROR,
            applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
          } as AppointmentCancelRequest,
          res.locals.user,
        )
        expect(activitiesService.editAppointment).not.toHaveBeenCalled()
        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.CANCEL_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('isDelete', 'true')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.THIS_APPOINTMENT)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirect).toHaveBeenCalledWith(`/appointments/${appointmentId}`)
      })

      it('when changing the location', async () => {
        req.session.editAppointmentJourney.property = 'location'
        req.session.editAppointmentJourney.location = {
          id: 2,
          description: 'Updated location',
        }

        await service.edit(req, res, AppointmentApplyTo.THIS_APPOINTMENT)

        expect(activitiesService.cancelAppointment).not.toHaveBeenCalled()
        expect(activitiesService.editAppointment).toHaveBeenCalledWith(
          2,
          { internalLocationId: 2, applyTo: AppointmentApplyTo.THIS_APPOINTMENT } as AppointmentUpdateRequest,
          res.locals.user,
        )
        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('property', 'location')
            .addProperty('propertyChanged', 'true')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.THIS_APPOINTMENT)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}`,
          "You've changed the location for this appointment",
        )
      })

      it('when changing the start date', async () => {
        req.session.editAppointmentJourney.property = 'date-and-time'
        req.session.editAppointmentJourney.startDate = '2023-05-16'

        await service.edit(req, res, AppointmentApplyTo.THIS_APPOINTMENT)

        expect(activitiesService.cancelAppointment).not.toHaveBeenCalled()
        expect(activitiesService.editAppointment).toHaveBeenCalledWith(
          2,
          {
            startDate: '2023-05-16',
            applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
          } as AppointmentUpdateRequest,
          res.locals.user,
        )
        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('property', 'date-and-time')
            .addProperty('propertyChanged', 'true')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.THIS_APPOINTMENT)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}`,
          "You've changed the date for this appointment",
        )
      })

      it('when changing the start time', async () => {
        req.session.editAppointmentJourney.property = 'date-and-time'
        req.session.editAppointmentJourney.startTime = {
          hour: 10,
          minute: 0,
          date: parseDate('2023-05-15T10:00', "yyyy-MM-dd'T'HH:mm"),
        }

        await service.edit(req, res, AppointmentApplyTo.THIS_APPOINTMENT)

        expect(activitiesService.cancelAppointment).not.toHaveBeenCalled()
        expect(activitiesService.editAppointment).toHaveBeenCalledWith(
          2,
          {
            startTime: '10:00',
            applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
          } as AppointmentUpdateRequest,
          res.locals.user,
        )
        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('property', 'date-and-time')
            .addProperty('propertyChanged', 'true')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.THIS_APPOINTMENT)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}`,
          "You've changed the time for this appointment",
        )
      })

      it('when changing the end time', async () => {
        req.session.editAppointmentJourney.property = 'date-and-time'
        req.session.editAppointmentJourney.endTime = {
          hour: 14,
          minute: 30,
          date: parseDate('2023-05-15T14:30', "yyyy-MM-dd'T'HH:mm"),
        }

        await service.edit(req, res, AppointmentApplyTo.THIS_APPOINTMENT)

        expect(activitiesService.cancelAppointment).not.toHaveBeenCalled()
        expect(activitiesService.editAppointment).toHaveBeenCalledWith(
          2,
          {
            endTime: '14:30',
            applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
          } as AppointmentUpdateRequest,
          res.locals.user,
        )
        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('property', 'date-and-time')
            .addProperty('propertyChanged', 'true')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.THIS_APPOINTMENT)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}`,
          "You've changed the time for this appointment",
        )
      })

      it('when changing the end time from null', async () => {
        req.session.editAppointmentJourney.property = 'date-and-time'
        req.session.appointmentJourney.endTime = null
        req.session.editAppointmentJourney.endTime = {
          hour: 14,
          minute: 30,
          date: parseDate('2023-05-15T14:30', "yyyy-MM-dd'T'HH:mm"),
        }

        await service.edit(req, res, AppointmentApplyTo.THIS_APPOINTMENT)

        expect(activitiesService.cancelAppointment).not.toHaveBeenCalled()
        expect(activitiesService.editAppointment).toHaveBeenCalledWith(
          2,
          {
            endTime: '14:30',
            applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
          } as AppointmentUpdateRequest,
          res.locals.user,
        )
        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('property', 'date-and-time')
            .addProperty('propertyChanged', 'true')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.THIS_APPOINTMENT)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}`,
          "You've changed the time for this appointment",
        )
      })

      it('when changing the start time and end time', async () => {
        req.session.editAppointmentJourney.property = 'date-and-time'
        req.session.editAppointmentJourney.startTime = {
          hour: 10,
          minute: 0,
          date: parseDate('2023-05-15T10:00', "yyyy-MM-dd'T'HH:mm"),
        }
        req.session.editAppointmentJourney.endTime = {
          hour: 14,
          minute: 30,
          date: parseDate('2023-05-15T14:30', "yyyy-MM-dd'T'HH:mm"),
        }

        await service.edit(req, res, AppointmentApplyTo.THIS_APPOINTMENT)

        expect(activitiesService.cancelAppointment).not.toHaveBeenCalled()
        expect(activitiesService.editAppointment).toHaveBeenCalledWith(
          2,
          {
            startTime: '10:00',
            endTime: '14:30',
            applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
          } as AppointmentUpdateRequest,
          res.locals.user,
        )
        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('property', 'date-and-time')
            .addProperty('propertyChanged', 'true')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.THIS_APPOINTMENT)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}`,
          "You've changed the time for this appointment",
        )
      })

      it('when changing the start date and start time', async () => {
        req.session.editAppointmentJourney.property = 'date-and-time'
        req.session.editAppointmentJourney.startDate = '2023-05-16'
        req.session.editAppointmentJourney.startTime = {
          hour: 10,
          minute: 0,
          date: parseDate('2023-05-16T10:00', "yyyy-MM-dd'T'HH:mm"),
        }

        await service.edit(req, res, AppointmentApplyTo.THIS_APPOINTMENT)

        expect(activitiesService.cancelAppointment).not.toHaveBeenCalled()
        expect(activitiesService.editAppointment).toHaveBeenCalledWith(
          2,
          {
            startDate: '2023-05-16',
            startTime: '10:00',
            applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
          } as AppointmentUpdateRequest,
          res.locals.user,
        )
        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('property', 'date-and-time')
            .addProperty('propertyChanged', 'true')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.THIS_APPOINTMENT)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}`,
          "You've changed the date and time for this appointment",
        )
      })

      it('when changing the start date and end time', async () => {
        req.session.editAppointmentJourney.property = 'date-and-time'
        req.session.editAppointmentJourney.startDate = '2023-05-16'
        req.session.editAppointmentJourney.endTime = {
          hour: 14,
          minute: 30,
          date: parseDate('2023-05-16T14:30', "yyyy-MM-dd'T'HH:mm"),
        }

        await service.edit(req, res, AppointmentApplyTo.THIS_APPOINTMENT)

        expect(activitiesService.cancelAppointment).not.toHaveBeenCalled()
        expect(activitiesService.editAppointment).toHaveBeenCalledWith(
          2,
          {
            startDate: '2023-05-16',
            endTime: '14:30',
            applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
          } as AppointmentUpdateRequest,
          res.locals.user,
        )
        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('property', 'date-and-time')
            .addProperty('propertyChanged', 'true')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.THIS_APPOINTMENT)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}`,
          "You've changed the date and time for this appointment",
        )
      })

      it('when changing the start date, start time and end time', async () => {
        req.session.editAppointmentJourney.property = 'date-and-time'
        req.session.editAppointmentJourney.startDate = '2023-05-16'
        req.session.editAppointmentJourney.startTime = {
          hour: 10,
          minute: 0,
          date: parseDate('2023-05-16T10:00', "yyyy-MM-dd'T'HH:mm"),
        }
        req.session.editAppointmentJourney.endTime = {
          hour: 14,
          minute: 30,
          date: parseDate('2023-05-16T14:30', "yyyy-MM-dd'T'HH:mm"),
        }

        await service.edit(req, res, AppointmentApplyTo.THIS_APPOINTMENT)

        expect(activitiesService.cancelAppointment).not.toHaveBeenCalled()
        expect(activitiesService.editAppointment).toHaveBeenCalledWith(
          2,
          {
            startDate: '2023-05-16',
            startTime: '10:00',
            endTime: '14:30',
            applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
          } as AppointmentUpdateRequest,
          res.locals.user,
        )
        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('property', 'date-and-time')
            .addProperty('propertyChanged', 'true')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.THIS_APPOINTMENT)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}`,
          "You've changed the date and time for this appointment",
        )
      })

      it('when changing the extra information', async () => {
        req.session.editAppointmentJourney.property = 'extra-information'
        req.session.editAppointmentJourney.extraInformation = 'Updated extra information'

        await service.edit(req, res, AppointmentApplyTo.THIS_APPOINTMENT)

        expect(activitiesService.cancelAppointment).not.toHaveBeenCalled()
        expect(activitiesService.editAppointment).toHaveBeenCalledWith(
          2,
          {
            extraInformation: 'Updated extra information',
            applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
          } as AppointmentUpdateRequest,
          res.locals.user,
        )
        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('property', 'extra-information')
            .addProperty('propertyChanged', 'true')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.THIS_APPOINTMENT)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}`,
          "You've changed the extra information for this appointment",
        )
      })
    })

    describe('apply to this and all future appointments', () => {
      beforeEach(() => {
        req.session.appointmentJourney.repeat = YesNo.YES
      })

      it('when cancelling', async () => {
        req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CANCELLED

        await service.edit(req, res, AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS)

        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.CANCEL_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('isDelete', 'false')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirect).toHaveBeenCalledWith(`/appointments/${appointmentId}`)
      })

      it('when un-cancelling', async () => {
        req.session.editAppointmentJourney.uncancel = true

        await service.edit(req, res, AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS)

        expect(activitiesService.uncancelAppointment).toHaveBeenCalledWith(
          2,
          {
            applyTo: AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS,
          } as AppointmentUncancelRequest,
          res.locals.user,
        )
        expect(activitiesService.editAppointment).not.toHaveBeenCalled()
        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.UNCANCEL_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('isDelete', 'false')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirect).toHaveBeenCalledWith(`/appointments/${appointmentId}`)
      })

      it('when deleting', async () => {
        req.session.editAppointmentJourney.appointmentSeries = {
          id: 1,
        } as AppointmentSeriesSummary
        req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CREATED_IN_ERROR

        await service.edit(req, res, AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS)

        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.CANCEL_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('isDelete', 'true')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirect).toHaveBeenCalledWith(`/appointments/${appointmentId}`)
      })

      it('when changing the location', async () => {
        req.session.editAppointmentJourney.property = 'location'
        req.session.editAppointmentJourney.location = {
          id: 2,
          description: 'Updated location',
        }

        await service.edit(req, res, AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS)

        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('property', 'location')
            .addProperty('propertyChanged', 'true')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}`,
          "You've changed the location for appointments 2 to 4 in the series",
        )
      })

      it('when changing the location deleted last appointment', async () => {
        req.session.editAppointmentJourney.property = 'location'
        req.session.editAppointmentJourney.appointments = [
          {
            sequenceNumber: 1,
            startDate: '2023-01-01',
          },
          {
            sequenceNumber: 2,
            startDate: '2023-01-02',
          },
          {
            sequenceNumber: 3,
            startDate: '2023-01-03',
          },
        ]
        req.session.editAppointmentJourney.location = {
          id: 2,
          description: 'Updated location',
        }

        await service.edit(req, res, AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS)

        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('property', 'location')
            .addProperty('propertyChanged', 'true')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}`,
          "You've changed the location for appointments 2 to 3 in the series",
        )
      })
    })

    describe('apply to all future appointments', () => {
      beforeEach(() => {
        req.session.appointmentJourney.repeat = YesNo.YES
      })

      it('when cancelling', async () => {
        req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CANCELLED

        await service.edit(req, res, AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS)

        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.CANCEL_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('isDelete', 'false')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirect).toHaveBeenCalledWith(`/appointments/${appointmentId}`)
      })

      it('when un-cancelling', async () => {
        req.session.editAppointmentJourney.uncancel = true

        await service.edit(req, res, AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS)

        expect(activitiesService.uncancelAppointment).toHaveBeenCalledWith(
          2,
          {
            applyTo: AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS,
          } as AppointmentUncancelRequest,
          res.locals.user,
        )
        expect(activitiesService.editAppointment).not.toHaveBeenCalled()
        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.UNCANCEL_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('isDelete', 'false')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirect).toHaveBeenCalledWith(`/appointments/${appointmentId}`)
      })

      it('when deleting', async () => {
        req.session.editAppointmentJourney.appointmentSeries = {
          id: 1,
        } as AppointmentSeriesSummary
        req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CREATED_IN_ERROR

        await service.edit(req, res, AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS)

        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.CANCEL_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('isDelete', 'true')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirect).toHaveBeenCalledWith(`/appointments/${appointmentId}`)
      })

      it('when changing the location', async () => {
        req.session.editAppointmentJourney.property = 'location'
        req.session.editAppointmentJourney.location = {
          id: 2,
          description: 'Updated location',
        }

        await service.edit(req, res, AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS)

        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('property', 'location')
            .addProperty('propertyChanged', 'true')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}`,
          "You've changed the location for appointments 1 to 4 in the series",
        )
      })

      it('when changing the location two remaining appointments', async () => {
        req.session.editAppointmentJourney.property = 'location'
        req.session.editAppointmentJourney.appointments = [
          {
            sequenceNumber: 3,
            startDate: '2023-01-01',
          },
          {
            sequenceNumber: 4,
            startDate: '2023-01-02',
          },
        ]
        req.session.editAppointmentJourney.sequenceNumber = 3
        req.session.editAppointmentJourney.location = {
          id: 2,
          description: 'Updated location',
        }

        await service.edit(req, res, AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS)

        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('property', 'location')
            .addProperty('propertyChanged', 'true')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}`,
          "You've changed the location for appointments 3 to 4 in the series",
        )
      })

      it('when changing the location deleted last appointment', async () => {
        req.session.editAppointmentJourney.property = 'location'
        req.session.editAppointmentJourney.appointments = [
          {
            sequenceNumber: 1,
            startDate: '2023-01-01',
          },
          {
            sequenceNumber: 2,
            startDate: '2023-01-02',
          },
          {
            sequenceNumber: 3,
            startDate: '2023-01-03',
          },
        ]
        req.session.editAppointmentJourney.location = {
          id: 2,
          description: 'Updated location',
        }

        await service.edit(req, res, AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS)

        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('property', 'location')
            .addProperty('propertyChanged', 'true')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}`,
          "You've changed the location for appointments 1 to 3 in the series",
        )
      })

      it('when adding prisoners to the appointment', async () => {
        req.session.editAppointmentJourney.property = 'add-prisoners'
        req.session.editAppointmentJourney.addPrisoners = [
          {
            number: 'A1234BC',
            name: 'TEST PRISONER1',
            cellLocation: '1-1-1',
            status: 'ACTIVE IN',
            prisonCode: 'MDI',
          },
          {
            number: 'B2345CD',
            name: 'TEST PRISONER2',
            cellLocation: '1-1-1',
            status: 'ACTIVE IN',
            prisonCode: 'MDI',
          },
        ]

        await service.edit(req, res, AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS)

        expect(metricsService.trackEvent).toBeCalledWith(
          new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
            .addProperty('journeyId', journeyId)
            .addProperty('appointmentId', appointmentId)
            .addProperty('property', 'add-prisoners')
            .addProperty('propertyChanged', 'true')
            .addProperty('isApplyToQuestionRequired', 'true')
            .addProperty('applyTo', AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS)
            .addMeasurement('journeyTimeSec', 60),
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
        expect(req.session.journeyMetrics).toBeNull()
        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}`,
          "You've added these people to appointments 1 to 4 in the series",
        )
      })

      it('when adding prisoners to the appointment and exceeding "MAX_APPOINTMENT_INSTANCES"', async () => {
        const { maxAppointmentInstances } = config.appointmentsConfig

        const numberOfAppointments = 100
        req.session.editAppointmentJourney.numberOfAppointments = numberOfAppointments
        req.session.editAppointmentJourney.appointments = Array(numberOfAppointments)
          .fill(null)
          .map((_, i) => ({
            sequenceNumber: i + 1,
            startDate: formatDate(addDays(weekTomorrow, i), 'yyyy-MM-dd'),
          }))
        req.session.editAppointmentJourney.property = 'add-prisoners'

        const maxAllowedPrisoners = Math.floor(maxAppointmentInstances / 100)

        // Add 1 more than allowed
        req.session.editAppointmentJourney.addPrisoners = Array(maxAllowedPrisoners + 1)
          .fill(null)
          .map((_, i) => ({
            number: `A${i}BC`,
            name: 'TEST PRISONER',
            cellLocation: '1-1-1',
            status: 'ACTIVE IN',
            prisonCode: 'MDI',
          }))

        await service.edit(req, res, AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS)

        expect(res.validationFailed).toHaveBeenCalledWith(
          'applyTo',
          `You cannot add more than ${maxAllowedPrisoners} attendees for this number of appointments.`,
        )
        expect(metricsService.trackEvent).not.toHaveBeenCalled()
        expect(req.session.appointmentJourney).not.toBeNull()
        expect(req.session.editAppointmentJourney).not.toBeNull()
        expect(req.session.journeyMetrics).not.toBeNull()
        expect(res.redirectWithSuccess).toHaveBeenCalledTimes(0)
      })
    })
  })
})
