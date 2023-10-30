import { Request } from 'express'
import { Activity, AppointmentDetails, AppointmentSetDetails } from '../@types/activitiesAPI/types'
import { ServiceUser } from '../@types/express'
import { AllocateToActivityJourney } from '../routes/activities/manage-allocations/journey'
import { WaitListApplicationJourney } from '../routes/activities/waitlist-application/journey'
import { simpleDateFromDate } from '../commonValidationTypes/simpleDate'
import { AppointmentJourneyMode } from '../routes/appointments/create-and-edit/appointmentJourney'
import { isApplyToQuestionRequired } from '../utils/editAppointmentUtils'
import { AppointmentApplyTo, AppointmentCancellationReason } from '../@types/appointments'
import { MetricsEventType } from '../@types/metricsEvents'

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

  static CREATE_ACTIVITY_JOURNEY_COMPLETED(user: ServiceUser, activity: Activity) {
    const event = new MetricsEvent(MetricsEventType.CREATE_ACTIVITY_JOURNEY_COMPLETED, user)
    event.addProperty('tier', activity.tier?.description)
    if (activity.organiser) event.addProperty('organiser', activity.organiser?.description)
    return event
  }

  static CREATE_ALLOCATION_JOURNEY_STARTED(user: ServiceUser) {
    return new MetricsEvent(MetricsEventType.CREATE_ALLOCATION_JOURNEY_STARTED, user)
  }

  static CREATE_ALLOCATION_JOURNEY_COMPLETED(allocation: AllocateToActivityJourney, user: ServiceUser) {
    const event = new MetricsEvent(MetricsEventType.CREATE_ALLOCATION_JOURNEY_COMPLETED, user)
    return event.addProperties({
      prisonerNumber: allocation.inmate.prisonerNumber,
      activityId: allocation.activity.activityId?.toString(),
      startDate: allocation.startDate,
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

  static CREATE_UNLOCK_LIST(date: Date, timeslot: string, location: string, user: ServiceUser) {
    return new MetricsEvent(MetricsEventType.CREATE_UNLOCK_LIST, user).addProperties({
      unlockDate: simpleDateFromDate(date).toIsoString(),
      timePeriod: timeslot,
      location,
    })
  }

  static CREATE_APPOINTMENT_JOURNEY_STARTED(req: Request, user: ServiceUser) {
    return new MetricsEvent(MetricsEventType.CREATE_APPOINTMENT_JOURNEY_STARTED, user).addJourneyStartedMetrics(req)
  }

  static CREATE_APPOINTMENT_JOURNEY_COMPLETED(appointment: AppointmentDetails, req: Request, user: ServiceUser) {
    return new MetricsEvent(MetricsEventType.CREATE_APPOINTMENT_JOURNEY_COMPLETED, user)
      .addJourneyCompletedMetrics(req)
      .addProperty('appointmentSeriesId', appointment.appointmentSeries.id)
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
