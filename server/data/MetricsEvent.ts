import { plainToInstance } from 'class-transformer'
import { AppointmentDetails, AppointmentSetDetails, ScheduledActivity } from '../@types/activitiesAPI/types'
import { ServiceUser } from '../@types/express'
import SimpleTime from '../commonValidationTypes/simpleTime'
import { AllocateToActivityJourney } from '../routes/activities/allocate-to-activity/journey'
import { WaitListApplicationJourney } from '../routes/activities/waitlist-application/journey'
import { JourneyMetrics } from '../routes/journeyMetrics'
import { parseDate } from '../utils/utils'
import SimpleDate, { simpleDateFromDate } from '../commonValidationTypes/simpleDate'
import { AppointmentJourneyMode } from '../routes/appointments/create-and-edit/appointmentJourney'

export enum MetricsEventType {
  ACTIVITY_CREATED = 'SAA-Activity-Created-UI',
  ALLOCATION_CREATED = 'SAA-Allocation-Created-UI',
  WAITLIST_NEW_APPLICATION = 'SAA-Waitlist-New-Application-UI',
  ATTENDANCE_RECORDED = 'SAA-Attendance-Recorded-UI',
  UNLOCK_LIST_GENERATED = 'SAA-Unlock-List-Generated-UI',
  APPOINTMENT_MOVEMENT_SLIP_PRINTED = 'SAA-Appointment-Movement-Slips-Printed-UI',
  APPOINTMENT_SET_MOVEMENT_SLIP_PRINTED = 'SAA-Appointment-Set-Movement-Slips-Printed-UI',
  APPOINTMENT_CHANGE_FROM_SCHEDULE = 'SAA-Appointment-Change-From-Schedule-UI',
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
    if (journeyStartTime) this.addMeasurement('journeyTimeSec', (Date.now() - journeyStartTime) / 1000)
    if (source) this.addProperty('journeySource', source)
    return this
  }

  static ACTIVITY_CREATED = (user: ServiceUser) => new MetricsEvent(MetricsEventType.ACTIVITY_CREATED, user)

  static ALLOCATION_CREATED(allocation: AllocateToActivityJourney, user: ServiceUser) {
    const startDate = plainToInstance(SimpleDate, allocation.startDate).toIsoString()

    const event = new MetricsEvent(MetricsEventType.ALLOCATION_CREATED, user)
    return event.addProperties({
      prisonerNumber: allocation.inmate?.prisonerNumber,
      activityId: allocation.activity.activityId?.toString(),
      startDate,
    })
  }

  static ATTENDANCE_RECORDED(
    instance: ScheduledActivity,
    prisonerNumber: string,
    attendanceReason: string,
    user: ServiceUser,
  ) {
    const [hour, minute] = instance.endTime.split(':')
    const endTime = plainToInstance(SimpleTime, { hour, minute })
    const endDate = parseDate(instance.date)

    const event = new MetricsEvent(MetricsEventType.ATTENDANCE_RECORDED, user)
    return event.addProperties({
      activityId: instance.activitySchedule.activity.id,
      scheduledInstanceId: instance.id,
      prisonerNumber,
      activitySummary: instance.activitySchedule.activity.summary,
      attendanceReason,
      attendedBeforeSessionEnded: new Date() < endTime.toDate(endDate) ? 'true' : 'false',
    })
  }

  static WAITLIST_NEW_APPLICATION(waitlist: WaitListApplicationJourney, user: ServiceUser) {
    const event = new MetricsEvent(MetricsEventType.WAITLIST_NEW_APPLICATION, user)
    return event.addProperties({
      prisonerNumber: waitlist.prisoner?.prisonerNumber.toString(),
      activityId: waitlist.activity?.activityId?.toString(),
      activityDescription: waitlist.activity?.activityName,
      requestDate: plainToInstance(SimpleDate, waitlist.requestDate).toIsoString(),
      status: waitlist.status,
      requester: waitlist.requester,
    })
  }

  static UNLOCK_LIST_GENERATED(date: Date, timeslot: string, location: string, user: ServiceUser) {
    return new MetricsEvent(MetricsEventType.UNLOCK_LIST_GENERATED, user).addProperties({
      unlockDate: simpleDateFromDate(date).toIsoString(),
      timePeriod: timeslot,
      location,
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
