import { plainToInstance } from 'class-transformer'
import { AttendanceUpdateRequest, ScheduledActivity } from '../@types/activitiesAPI/types'
import { ServiceUser } from '../@types/express'
import SimpleTime from '../commonValidationTypes/simpleTime'
import { AllocateToActivityJourney } from '../routes/activities/allocate-to-activity/journey'
import { WaitListApplicationJourney } from '../routes/activities/waitlist-application/journey'
import { JourneyMetrics } from '../routes/journeyMetrics'
import { parseDate } from '../utils/utils'

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

  setAllocation(allocation: AllocateToActivityJourney) {
    return this.addProperties({
      prisonerNumber: allocation.inmate?.prisonerNumber,
      activityId: allocation.activity.activityId?.toString(),
      startDate: allocation.startDate?.toString(),
    })
  }

  setWaitlist(waitlist: WaitListApplicationJourney) {
    return this.addProperties({
      prisonerNumber: waitlist.prisoner?.prisonerNumber.toString(),
      activityId: waitlist.activity?.activityId?.toString(),
      activityDescription: waitlist.activity?.activityName,
      status: waitlist.status,
      requester: waitlist.requester,
    })
  }

  setJourneyMetrics(journeyMetrics: JourneyMetrics) {
    return this.addProperties({
      journeyTimeSec: (Date.now() - journeyMetrics.journeyStartTime) / 1000,
    })
  }

  setAttendanceUpdate(instance: ScheduledActivity, updateAttendances: AttendanceUpdateRequest) {
    const [hour, minute] = instance.endTime.split(':')
    const endTime = plainToInstance(SimpleTime, { hour, minute })
    const endDate = parseDate(instance.date)

    return this.addProperties({
      activityId: instance.activitySchedule.activity.id,
      attendanceReason: updateAttendances.attendanceReason,
      attendedBeforeSessionEnded: new Date() < endTime.toDate(endDate) ? 'true' : 'false',
    })
  }
}
