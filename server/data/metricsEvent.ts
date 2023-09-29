import { plainToInstance } from 'class-transformer'
import { Request } from 'express'
import { AppointmentDetails, AppointmentSetDetails } from '../@types/activitiesAPI/types'
import { ServiceUser } from '../@types/express'
import { AllocateToActivityJourney } from '../routes/activities/allocate-to-activity/journey'
import { WaitListApplicationJourney } from '../routes/activities/waitlist-application/journey'
import { JourneyMetrics } from '../routes/journeyMetrics'
import SimpleDate, { simpleDateFromDate } from '../commonValidationTypes/simpleDate'
import { AppointmentJourneyMode } from '../routes/appointments/create-and-edit/appointmentJourney'

export enum MetricsEventType {
  CREATE_ACTIVITY_JOURNEY_COMPLETED = 'SAA-Create-Activity-Journey-Completed',
  CREATE_ALLOCATION_JOURNEY_COMPLETED = 'SAA-Create_Allocation-Journey-Completed',
  WAITLIST_APPLICATION_JOURNEY_COMPLETED = 'SAA-Waitlist-Application-Journey-Completed',
  CREATE_UNLOCK_LIST = 'SAA-Create-Unlock-List',
  CREATE_APPOINTMENT_JOURNEY_STARTED = 'SAA-Create-Appointment-Journey-Started',
  CREATE_APPOINTMENT_JOURNEY_COMPLETED = 'SAA-Create-Appointment-Journey-Completed',
  CREATE_APPOINTMENT_SET_JOURNEY_STARTED = 'SAA-Create-Appointment-Set-Journey-Started',
  CREATE_APPOINTMENT_SET_JOURNEY_COMPLETED = 'SAA-Create-Appointment-Set-Journey-Completed',
  EDIT_APPOINTMENT_JOURNEY_STARTED = 'SAA-Edit-Appointment-Journey-Started',
  EDIT_APPOINTMENT_JOURNEY_COMPLETED = 'SAA-Edit-Appointment-Journey-Completed',
  CANCEL_APPOINTMENT_JOURNEY_STARTED = 'SAA-Cancel-Appointment-Journey-Started',
  CANCEL_APPOINTMENT_JOURNEY_COMPLETED = 'SAA-Cancel-Appointment-Journey-Completed',
  APPOINTMENT_MOVEMENT_SLIP_PRINTED = 'SAA-Appointment-Movement-Slips-Printed',
  APPOINTMENT_SET_MOVEMENT_SLIP_PRINTED = 'SAA-Appointment-Set-Movement-Slips-Printed',
  APPOINTMENT_CHANGE_FROM_SCHEDULE = 'SAA-Appointment-Change-From-Schedule',
}

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

  setJourneyMetrics(journeyMetrics?: JourneyMetrics) {
    if (!journeyMetrics) return this

    const { journeyStartTime, source } = journeyMetrics
    if (journeyStartTime) this.addMeasurement('journeyTimeSec', Math.round((Date.now() - journeyStartTime) / 1000))
    if (source) this.addProperty('journeySource', source)
    return this
  }

  startJourneyMetrics(req: Request, source?: string) {
    const { journeyId } = req.params

    if (journeyId) this.addProperty('journeyId', journeyId)
    if (source) this.addProperty('journeySource', source)

    req.session.journeyMetrics = {
      journeyStartTime: Date.now(),
      source,
    }

    return this
  }

  static CREATE_ACTIVITY_JOURNEY_COMPLETED = (user: ServiceUser) =>
    new MetricsEvent(MetricsEventType.CREATE_ACTIVITY_JOURNEY_COMPLETED, user)

  static CREATE_ALLOCATION_JOURNEY_COMPLETED(allocation: AllocateToActivityJourney, user: ServiceUser) {
    const startDate = plainToInstance(SimpleDate, allocation.startDate).toIsoString()

    const event = new MetricsEvent(MetricsEventType.CREATE_ALLOCATION_JOURNEY_COMPLETED, user)
    return event.addProperties({
      prisonerNumber: allocation.inmate?.prisonerNumber,
      activityId: allocation.activity.activityId?.toString(),
      startDate,
    })
  }

  static WAITLIST_APPLICATION_JOURNEY_COMPLETED(waitlist: WaitListApplicationJourney, user: ServiceUser) {
    const event = new MetricsEvent(MetricsEventType.WAITLIST_APPLICATION_JOURNEY_COMPLETED, user)
    return event.addProperties({
      prisonerNumber: waitlist.prisoner?.prisonerNumber.toString(),
      activityId: waitlist.activity?.activityId?.toString(),
      activityDescription: waitlist.activity?.activityName,
      requestDate: plainToInstance(SimpleDate, waitlist.requestDate).toIsoString(),
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

  static CREATE_APPOINTMENT_JOURNEY_STARTED(source: string, req: Request, user: ServiceUser) {
    return new MetricsEvent(MetricsEventType.CREATE_APPOINTMENT_JOURNEY_STARTED, user).startJourneyMetrics(req, source)
  }

  static CREATE_APPOINTMENT_JOURNEY_COMPLETED(appointment: AppointmentDetails, req: Request, user: ServiceUser) {
    const event = new MetricsEvent(MetricsEventType.CREATE_APPOINTMENT_JOURNEY_COMPLETED, user)
      .addProperty('journeyId', req.params.journeyId)
      .setJourneyMetrics(req.session.journeyMetrics)
      .addProperty('appointmentSeriesId', appointment.appointmentSeries.id)

    req.session.journeyMetrics = null

    return event
  }

  static CREATE_APPOINTMENT_SET_JOURNEY_COMPLETED(
    appointmentSet: AppointmentSetDetails,
    req: Request,
    user: ServiceUser,
  ) {
    const event = new MetricsEvent(MetricsEventType.CREATE_APPOINTMENT_SET_JOURNEY_COMPLETED, user)
      .addProperty('journeyId', req.params.journeyId)
      .setJourneyMetrics(req.session.journeyMetrics)
      .addProperty('appointmentSetId', appointmentSet.id)

    req.session.journeyMetrics = null

    return event
  }

  static CREATE_APPOINTMENT_SET_JOURNEY_STARTED(req: Request, user: ServiceUser) {
    return new MetricsEvent(MetricsEventType.CREATE_APPOINTMENT_SET_JOURNEY_STARTED, user).startJourneyMetrics(req)
  }

  static EDIT_APPOINTMENT_JOURNEY_STARTED(
    appointment: AppointmentDetails,
    property: string,
    isApplyToQuestionRequired: boolean,
    req: Request,
    user: ServiceUser,
  ) {
    return new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_STARTED, user)
      .startJourneyMetrics(req)
      .addProperties({
        appointmentId: appointment.id,
        property,
        isApplyToQuestionRequired: isApplyToQuestionRequired.toString(),
      })
  }

  static CANCEL_APPOINTMENT_JOURNEY_STARTED(
    appointment: AppointmentDetails,
    isApplyToQuestionRequired: boolean,
    req: Request,
    user: ServiceUser,
  ) {
    return new MetricsEvent(MetricsEventType.CANCEL_APPOINTMENT_JOURNEY_STARTED, user)
      .startJourneyMetrics(req)
      .addProperties({
        appointmentId: appointment.id,
        isApplyToQuestionRequired: isApplyToQuestionRequired.toString(),
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
