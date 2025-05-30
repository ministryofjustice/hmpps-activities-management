import { Request } from 'express'
import { AppointmentDetails, AppointmentSetDetails } from '../@types/activitiesAPI/types'
import { ServiceUser } from '../@types/express'
import { AllocateToActivityJourney } from '../routes/activities/manage-allocations/journey'
import { WaitListApplicationJourney } from '../routes/activities/waitlist-application/journey'
import { AppointmentJourney, AppointmentJourneyMode } from '../routes/appointments/create-and-edit/appointmentJourney'
import { isApplyToQuestionRequired } from '../utils/editAppointmentUtils'
import { AppointmentApplyTo, AppointmentCancellationReason } from '../@types/appointments'
import { MetricsEventType } from '../@types/metricsEvents'
import { formatIsoDate } from '../utils/datePickerUtils'
import { SuspendJourney } from '../routes/activities/suspensions/journey'

export default class MetricsEvent {
  properties: Record<string, string | number>

  measurements: Record<string, number>

  name: string

  constructor(eventName: string, user?: ServiceUser) {
    this.name = eventName

    if (user) {
      this.properties = {
        user: user.username,
        prisonCode: user.activeCaseLoadId,
      }
    }
  }

  addProperty(name: string, value: string | number) {
    return this.addProperties({ [name]: value })
  }

  addProperties(properties: Record<string, string | number>) {
    this.properties = { ...this.properties, ...properties }
    return this
  }

  addMeasurement(name: string, value: number) {
    return this.addMeasurements({ [name]: value })
  }

  addMeasurements(measurements: Record<string, number>) {
    this.measurements = { ...this.measurements, ...measurements }
    return this
  }

  addJourneyStartedMetrics(req: Request) {
    const { journeyMetrics } = req.session
    const { journeyId } = req.params

    if (journeyId) this.addProperty('journeyId', journeyId)
    if (journeyMetrics?.source) this.addProperty('journeySource', journeyMetrics?.source)
    return this
  }

  addJourneyCompletedMetrics(req: Request) {
    if (!req.session.journeyMetrics) return this

    const { journeyId } = req.params
    const { journeyStartTime, source } = req.session.journeyMetrics

    if (journeyId) this.addProperty('journeyId', journeyId)
    if (source) this.addProperty('journeySource', source)
    if (journeyStartTime) this.addMeasurement('journeyTimeSec', Math.round((Date.now() - journeyStartTime) / 1000))
    return this
  }

  static CREATE_ACTIVITY_JOURNEY_STARTED(user: ServiceUser) {
    return new MetricsEvent(MetricsEventType.CREATE_ACTIVITY_JOURNEY_STARTED, user)
  }

  static CREATE_ACTIVITY_JOURNEY_COMPLETED(user: ServiceUser) {
    return new MetricsEvent(MetricsEventType.CREATE_ACTIVITY_JOURNEY_COMPLETED, user)
  }

  static CREATE_ALLOCATION_JOURNEY_STARTED(user: ServiceUser) {
    return new MetricsEvent(MetricsEventType.CREATE_ALLOCATION_JOURNEY_STARTED, user)
  }

  static CREATE_MULTIPLE_ALLOCATION_JOURNEY_STARTED(user: ServiceUser) {
    return new MetricsEvent(MetricsEventType.CREATE_MULTIPLE_ALLOCATION_JOURNEY_STARTED, user)
  }

  static CREATE_ALLOCATION_JOURNEY_COMPLETED(allocation: AllocateToActivityJourney, user: ServiceUser) {
    const event = new MetricsEvent(MetricsEventType.CREATE_ALLOCATION_JOURNEY_COMPLETED, user)
    return event.addProperties({
      prisonerNumber: allocation.inmate.prisonerNumber,
      activityId: allocation.activity.activityId?.toString(),
      startDate: allocation.startDate,
    })
  }

  static CREATE_MULTIPLE_ALLOCATION_JOURNEY_COMPLETED(allocation: AllocateToActivityJourney, user: ServiceUser) {
    const event = new MetricsEvent(MetricsEventType.CREATE_MULTIPLE_ALLOCATION_JOURNEY_COMPLETED, user)
    return event.addProperties({
      prisonerNumbers: allocation.inmates.map(a => a.prisonerNumber).join(),
      activityId: allocation.activity.activityId?.toString(),
      startDate: allocation.startDate,
    })
  }

  static SUSPEND_ALLOCATION_JOURNEY_COMPLETED(suspension: SuspendJourney, user: ServiceUser) {
    const event = new MetricsEvent(MetricsEventType.SUSPEND_ALLOCATION_JOURNEY_COMPLETED, user)
    return event.addProperties({
      prisonerNumber: suspension.inmate.prisonerNumber,
      allocationIds: suspension.allocations.map(a => a.allocationId).join(),
      suspendFrom: suspension.suspendFrom,
    })
  }

  static WAITLIST_APPLICATION_JOURNEY_STARTED(user: ServiceUser) {
    return new MetricsEvent(MetricsEventType.WAITLIST_APPLICATION_JOURNEY_STARTED, user)
  }

  static WAITLIST_APPLICATION_JOURNEY_COMPLETED(waitlist: WaitListApplicationJourney, user: ServiceUser) {
    const event = new MetricsEvent(MetricsEventType.WAITLIST_APPLICATION_JOURNEY_COMPLETED, user)
    return event.addProperties({
      prisonerNumber: waitlist.prisoner?.prisonerNumber.toString(),
      activityId: waitlist.activity?.activityId?.toString(),
      activityDescription: waitlist.activity?.activityName,
      requestDate: waitlist.requestDate,
      status: waitlist.status,
      requester: waitlist.requester,
    })
  }

  static CREATE_UNLOCK_LIST(date: Date, timeslot: string, location: string, prisonerCount: number, user: ServiceUser) {
    return new MetricsEvent(MetricsEventType.CREATE_UNLOCK_LIST, user)
      .addProperties({
        unlockDate: formatIsoDate(date),
        timePeriod: timeslot,
        location,
      })
      .addMeasurement('prisonerCount', prisonerCount)
  }

  static CREATE_APPOINTMENT_JOURNEY_STARTED(req: Request, user: ServiceUser) {
    return new MetricsEvent(MetricsEventType.CREATE_APPOINTMENT_JOURNEY_STARTED, user).addJourneyStartedMetrics(req)
  }

  static CREATE_APPOINTMENT_JOURNEY_COMPLETED(
    appointment: AppointmentDetails,
    req: Request,
    user: ServiceUser,
    appointmentJourney: AppointmentJourney,
  ) {
    return new MetricsEvent(MetricsEventType.CREATE_APPOINTMENT_JOURNEY_COMPLETED, user)
      .addJourneyCompletedMetrics(req)
      .addProperty('appointmentSeriesId', appointment.appointmentSeries.id)
      .addProperty('originalId', appointmentJourney.originalAppointmentId)
  }

  static CREATE_APPOINTMENT_SET_JOURNEY_STARTED(req: Request, user: ServiceUser) {
    return new MetricsEvent(MetricsEventType.CREATE_APPOINTMENT_SET_JOURNEY_STARTED, user).addJourneyStartedMetrics(req)
  }

  static CREATE_APPOINTMENT_SET_JOURNEY_COMPLETED(
    appointmentSet: AppointmentSetDetails,
    req: Request,
    user: ServiceUser,
  ) {
    return new MetricsEvent(MetricsEventType.CREATE_APPOINTMENT_SET_JOURNEY_COMPLETED, user)
      .addJourneyCompletedMetrics(req)
      .addProperty('appointmentSetId', appointmentSet.id)
  }

  static EDIT_APPOINTMENT_JOURNEY_STARTED(appointment: AppointmentDetails, req: Request, user: ServiceUser) {
    return new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_STARTED, user)
      .addJourneyStartedMetrics(req)
      .addProperties({
        appointmentId: appointment.id,
        property: req.session.editAppointmentJourney.property,
        isApplyToQuestionRequired: isApplyToQuestionRequired(req.session.editAppointmentJourney).toString(),
      })
  }

  static EDIT_APPOINTMENT_JOURNEY_COMPLETED(
    appointmentId: number,
    propertyChanged: boolean,
    applyTo: AppointmentApplyTo,
    req: Request,
    user: ServiceUser,
  ) {
    return new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_COMPLETED, user)
      .addProperty('journeyId', req.params.journeyId)
      .addJourneyCompletedMetrics(req)
      .addProperties({
        appointmentId,
        property: req.session.editAppointmentJourney.property,
        propertyChanged: propertyChanged.toString(),
        isApplyToQuestionRequired: isApplyToQuestionRequired(req.session.editAppointmentJourney).toString(),
        applyTo: propertyChanged ? applyTo : 'NA',
      })
  }

  static CANCEL_APPOINTMENT_JOURNEY_STARTED(appointment: AppointmentDetails, req: Request, user: ServiceUser) {
    return new MetricsEvent(MetricsEventType.CANCEL_APPOINTMENT_JOURNEY_STARTED, user)
      .addJourneyStartedMetrics(req)
      .addProperties({
        appointmentId: appointment.id,
        isApplyToQuestionRequired: isApplyToQuestionRequired(req.session.editAppointmentJourney).toString(),
      })
  }

  static CANCEL_APPOINTMENT_JOURNEY_COMPLETED(
    appointmentId: number,
    applyTo: AppointmentApplyTo,
    req: Request,
    user: ServiceUser,
  ) {
    return new MetricsEvent(MetricsEventType.CANCEL_APPOINTMENT_JOURNEY_COMPLETED, user)
      .addProperty('journeyId', req.params.journeyId)
      .addJourneyCompletedMetrics(req)
      .addProperties({
        appointmentId,
        isDelete: (
          req.session.editAppointmentJourney.cancellationReason === AppointmentCancellationReason.CREATED_IN_ERROR
        ).toString(),
        isApplyToQuestionRequired: isApplyToQuestionRequired(req.session.editAppointmentJourney).toString(),
        applyTo,
      })
  }

  static UNCANCEL_APPOINTMENT_JOURNEY_STARTED(appointment: AppointmentDetails, req: Request, user: ServiceUser) {
    return new MetricsEvent(MetricsEventType.UNCANCEL_APPOINTMENT_JOURNEY_STARTED, user)
      .addJourneyStartedMetrics(req)
      .addProperties({
        appointmentId: appointment.id,
        isApplyToQuestionRequired: isApplyToQuestionRequired(req.session.editAppointmentJourney).toString(),
      })
  }

  static UNCANCEL_APPOINTMENT_JOURNEY_COMPLETED(
    appointmentId: number,
    applyTo: AppointmentApplyTo,
    req: Request,
    user: ServiceUser,
  ) {
    return new MetricsEvent(MetricsEventType.UNCANCEL_APPOINTMENT_JOURNEY_COMPLETED, user)
      .addProperty('journeyId', req.params.journeyId)
      .addJourneyCompletedMetrics(req)
      .addProperties({
        appointmentId,
        isDelete: (
          req.session.editAppointmentJourney.cancellationReason === AppointmentCancellationReason.CREATED_IN_ERROR
        ).toString(),
        isApplyToQuestionRequired: isApplyToQuestionRequired(req.session.editAppointmentJourney).toString(),
        applyTo,
      })
  }

  static APPOINTMENT_MOVEMENT_SLIP_PRINTED(appointment: AppointmentDetails, user: ServiceUser) {
    return new MetricsEvent(MetricsEventType.APPOINTMENT_MOVEMENT_SLIP_PRINTED, user)
      .addProperty('appointmentId', appointment.id)
      .addMeasurement('movementSlipCount', appointment.attendees.length)
  }

  static APPOINTMENT_SET_MOVEMENT_SLIP_PRINTED(appointmentSet: AppointmentSetDetails, user: ServiceUser) {
    return new MetricsEvent(MetricsEventType.APPOINTMENT_SET_MOVEMENT_SLIP_PRINTED, user)
      .addProperty('appointmentSetId', appointmentSet.id)
      .addMeasurement('movementSlipCount', appointmentSet.appointments.length)
  }

  static APPOINTMENT_CHANGE_FROM_SCHEDULE(
    appointmentJourneyMode: AppointmentJourneyMode,
    property: string,
    user: ServiceUser,
  ) {
    return new MetricsEvent(MetricsEventType.APPOINTMENT_CHANGE_FROM_SCHEDULE, user).addProperties({
      appointmentJourneyMode,
      property,
    })
  }
}
