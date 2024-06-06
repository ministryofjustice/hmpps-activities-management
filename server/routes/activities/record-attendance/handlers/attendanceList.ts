import { Request, Response } from 'express'
import { startOfToday, startOfDay } from 'date-fns'
import { Expose, Transform } from 'class-transformer'
import ActivitiesService from '../../../../services/activitiesService'
import { eventClashes, getAttendanceSummary, toDate } from '../../../../utils/utils'
import PrisonService from '../../../../services/prisonService'
import { Attendance, ScheduledEvent } from '../../../../@types/activitiesAPI/types'
import HasAtLeastOne from '../../../../validators/hasAtLeastOne'
import AttendanceReason from '../../../../enum/attendanceReason'
import AttendanceStatus from '../../../../enum/attendanceStatus'
import { EventType, Prisoner } from '../../../../@types/activities'

import applyCancellationDisplayRule from '../../../../utils/applyCancellationDisplayRule'
import UserService from '../../../../services/userService'

export class AttendanceList {
  @Expose()
  @Transform(({ value }) => [value].flat()) // Transform to an array if only one value is provided
  @HasAtLeastOne({ message: 'Select at least one prisoner' })
  selectedAttendances: number[]
}

export interface ScheduledInstanceAttendance {
  prisoner: Prisoner
  attendance?: Attendance
  otherEvents: ScheduledEvent[]
}

export default class AttendanceListRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
    private readonly userService: UserService,
  ) {}

  private RELEVANT_ALERT_CODES = ['HA', 'XA', 'RCON', 'XEL', 'RNO121', 'PEEP', 'XRF', 'XSA', 'XTACT']

  GET = async (req: Request, res: Response): Promise<void> => {
    const instanceId = +req.params.id
    const { user } = res.locals

    let attendance: ScheduledInstanceAttendance[] = []

    const instance = await this.activitiesService.getScheduledActivity(instanceId, user).then(i => ({
      ...i,
      isAmendable: startOfDay(toDate(i.date)) >= startOfToday(),
    }))

    const prisonerNumbers = (await this.activitiesService.getAttendees(instanceId, user)).map(a => a.prisonerNumber)

    if (prisonerNumbers.length > 0) {
      const [attendees, otherEvents] = await Promise.all([
        this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user),
        this.activitiesService.getScheduledEventsForPrisoners(toDate(instance.date), prisonerNumbers, user),
      ])

      const allEvents = [
        ...otherEvents.activities,
        ...otherEvents.appointments,
        ...otherEvents.courtHearings,
        ...otherEvents.visits,
        ...otherEvents.adjudications,
      ]

      attendance = attendees.map(att => {
        const prisonerEvents = allEvents
          .filter(e => e.prisonerNumber === att.prisonerNumber)
          .filter(e => e.scheduledInstanceId !== instanceId)
          .filter(e => eventClashes(e, instance))
          .filter(e => e.eventType !== EventType.APPOINTMENT || applyCancellationDisplayRule(e))

        const attendee = {
          ...att,
          alerts: att.alerts.filter(a => this.RELEVANT_ALERT_CODES.includes(a.alertCode)),
        }

        return {
          prisoner: attendee,
          attendance: instance.attendances.find(a => a.prisonerNumber === att.prisonerNumber),
          otherEvents: prisonerEvents,
        }
      })
    }

    const userMap = await this.userService.getUserMap([instance.cancelledBy], user)

    res.render('pages/activities/record-attendance/attendance-list', {
      instance,
      isPayable: instance.activitySchedule.activity.paid,
      attendance,
      attendanceSummary: getAttendanceSummary(instance.attendances),
      userMap,
    })
  }

  ATTENDED = async (req: Request, res: Response): Promise<void> => {
    const instanceId = +req.params.id
    const { selectedAttendances }: { selectedAttendances: string[] } = req.body
    const { user } = res.locals

    const instance = await this.activitiesService.getScheduledActivity(instanceId, user)
    const isPaid = instance.activitySchedule.activity.paid

    const selectedAttendanceIds: number[] = []
    selectedAttendances.forEach(selectAttendee => selectedAttendanceIds.push(Number(selectAttendee.split('-')[0])))

    const attendances = selectedAttendanceIds.map(attendance => ({
      id: +attendance,
      prisonCode: user.activeCaseLoadId,
      status: AttendanceStatus.COMPLETED,
      attendanceReason: AttendanceReason.ATTENDED,
      issuePayment: isPaid,
    }))

    await this.activitiesService.updateAttendances(attendances, user)

    const successMessage = `You've saved attendance details for ${selectedAttendances.length} ${
      selectedAttendances.length === 1 ? 'person' : 'people'
    }`

    return res.redirectWithSuccess('attendance-list', 'Attendance recorded', successMessage)
  }

  NOT_ATTENDED = async (req: Request, res: Response): Promise<void> => {
    const instanceId = req.params.id
    const { user } = res.locals
    const { selectedAttendances }: { selectedAttendances: string[] } = req.body

    const selectedPrisoners: string[] = []
    selectedAttendances.forEach(selectAttendee => selectedPrisoners.push(selectAttendee.split('-')[1]))

    const instance = await this.activitiesService.getScheduledActivity(+instanceId, user)

    req.session.notAttendedJourney = {
      selectedPrisoners: [],
    }

    const otherScheduledEvents = await this.activitiesService
      .getScheduledEventsForPrisoners(toDate(instance.date), selectedPrisoners, user)
      .then(response => [
        ...response.activities,
        ...response.appointments,
        ...response.courtHearings,
        ...response.visits,
        ...response.adjudications,
      ])
      .then(events => events.filter(e => !e.cancelled))
      .then(events => events.filter(e => e.scheduledInstanceId !== +instanceId))
      .then(events => events.filter(e => eventClashes(e, instance)))

    const nonAttendees = await this.prisonService
      .searchInmatesByPrisonerNumbers(selectedPrisoners, user)
      .then(inmates =>
        inmates.map(i => ({
          name: `${i.firstName} ${i.lastName}`,
          prisonerNumber: i.prisonerNumber,
          location: i.cellLocation,
          otherEvents: otherScheduledEvents.filter(e => e.prisonerNumber === i.prisonerNumber),
          attendanceId: this.getAttendanceId(i.prisonerNumber, instance.attendances),
        })),
      )

    nonAttendees.forEach(nonAttendee => {
      req.session.notAttendedJourney.selectedPrisoners.push({
        attendanceId: nonAttendee.attendanceId,
        prisonerNumber: nonAttendee.prisonerNumber,
        prisonerName: nonAttendee.name,
        otherEvents: nonAttendee.otherEvents,
      })
    })

    res.redirect(`/activities/attendance/activities/${instanceId}/not-attended-reason`)
  }

  private getAttendanceId = (prisonerNumber: string, attendances: Attendance[]) => {
    const attendance = attendances.find(a => a.prisonerNumber === prisonerNumber)
    return attendance.id
  }
}
