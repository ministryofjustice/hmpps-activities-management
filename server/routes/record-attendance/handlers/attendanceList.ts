import { Request, Response } from 'express'
import { areIntervalsOverlapping, parse, startOfToday, endOfDay } from 'date-fns'
import { Expose, Transform } from 'class-transformer'
import ActivitiesService from '../../../services/activitiesService'
import { getAttendanceSummary, toDate } from '../../../utils/utils'
import PrisonService from '../../../services/prisonService'
import { Attendance, ScheduledActivity, ScheduledEvent } from '../../../@types/activitiesAPI/types'
import HasAtLeastOne from '../../../validators/hasAtLeastOne'

export class AttendanceList {
  @Expose()
  @Expose()
  @Transform(({ value }) => [value].flat()) // Transform to an array if only one value is provided
  @HasAtLeastOne({ message: 'Select at least one prisoner' })
  selectedAttendances: number[]
}

export default class AttendanceListRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const instanceId = req.params.id
    const { user } = res.locals

    const instance = await this.activitiesService.getScheduledActivity(+instanceId, user).then(i => ({
      ...i,
      isAmendable: endOfDay(toDate(i.date)) > startOfToday(),
    }))

    const prisonerNumbers = instance.attendances.map(a => a.prisonerNumber)
    const otherScheduledEvents = await this.activitiesService
      .getScheduledEventsForPrisoners(toDate(instance.date), prisonerNumbers, user)
      .then(response => [
        ...response.activities,
        ...response.appointments,
        ...response.courtHearings,
        ...response.visits,
      ])
      .then(events => events.filter(e => e.eventId !== +instanceId))
      .then(events => events.filter(e => this.eventClashes(e, instance)))

    const attendees = await this.prisonService.getInmateDetails(prisonerNumbers, user).then(inmates =>
      inmates.map(i => ({
        name: `${i.firstName} ${i.lastName}`,
        prisonerNumber: i.offenderNo,
        location: i.assignedLivingUnitDesc,
        otherEvents: otherScheduledEvents.filter(e => e.prisonerNumber === i.offenderNo),
        attendance: instance.attendances.find(a => a.prisonerNumber === i.offenderNo),
      })),
    )

    return res.render('pages/record-attendance/attendance-list', {
      activity: {
        name: instance.activitySchedule.activity.summary,
        location: instance.activitySchedule.internalLocation.description,
        ...getAttendanceSummary(instance.attendances),
      },
      instance,
      attendees,
    })
  }

  ATTENDED = async (req: Request, res: Response): Promise<void> => {
    const { selectedAttendances }: { selectedAttendances: string[] } = req.body
    const { user } = res.locals

    if (selectedAttendances) {
      const selectedAttendanceIds: number[] = []
      selectedAttendances.forEach(selectAttendee => selectedAttendanceIds.push(Number(selectAttendee.split('-')[0])))

      if (selectedAttendanceIds) {
        const attendances = selectedAttendanceIds.map(attendance => ({
          id: +attendance,
          attendanceReason: 'ATTENDED',
        }))
        await this.activitiesService.updateAttendances(attendances, user)
      }
    }

    return res.redirect('attendance-list')
  }

  NOT_ATTENDED = async (req: Request, res: Response): Promise<void> => {
    const instanceId = req.params.id
    const { user } = res.locals
    const { selectedAttendances }: { selectedAttendances: string[] } = req.body

    const selectedPrisoners: string[] = []
    selectedAttendances.forEach(selectAttendee => selectedPrisoners.push(selectAttendee.split('-')[1]))

    req.session.notAttendedJourney = {}
    if (!req.session.notAttendedJourney.selectedPrisoners) {
      req.session.notAttendedJourney.selectedPrisoners = []
    }

    const instance = await this.activitiesService.getScheduledActivity(+instanceId, user)

    const otherScheduledEvents = await this.activitiesService
      .getScheduledEventsForPrisoners(toDate(instance.date), selectedPrisoners, user)
      .then(response => [
        ...response.activities,
        ...response.appointments,
        ...response.courtHearings,
        ...response.visits,
      ])
      .then(events => events.filter(e => e.eventId !== +instanceId))
      .then(events => events.filter(e => this.eventClashes(e, instance)))

    const nonAttendees = await this.prisonService.getInmateDetails(selectedPrisoners, user).then(inmates =>
      inmates.map(i => ({
        name: `${i.firstName} ${i.lastName}`,
        prisonerNumber: i.offenderNo,
        location: i.assignedLivingUnitDesc,
        otherEvents: otherScheduledEvents.filter(e => e.prisonerNumber === i.offenderNo),
        attendanceLabel: this.getAttendanceLabel(i.offenderNo, instance.attendances),
        attendanceId: this.getAttendanceId(i.offenderNo, instance.attendances),
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

    res.redirect(`/attendance/activities/${instanceId}/not-attended-reason`)
  }

  private getAttendanceLabel = (prisonerNumber: string, attendances: Attendance[]) => {
    const attendance = attendances.find(a => a.prisonerNumber === prisonerNumber)
    if (attendance.status === 'WAITING') {
      return 'Not recorded yet'
    }
    return attendance.attendanceReason.description === 'ATTENDED' ? 'Attended' : 'Absent'
  }

  private getAttendanceId = (prisonerNumber: string, attendances: Attendance[]) => {
    const attendance = attendances.find(a => a.prisonerNumber === prisonerNumber)
    return attendance.id
  }

  private eventClashes = (event: ScheduledEvent, thisActivity: ScheduledActivity): boolean => {
    const timeToDate = (time: string) => parse(time, 'HH:mm', new Date())
    const toInterval = (start: Date, end: Date) => ({ start, end })

    const re = areIntervalsOverlapping(
      // TODO: Events from prison API may not have an endtime, so default the endtime to equal the start time. May need to handle this better
      toInterval(timeToDate(event.startTime), timeToDate(event.endTime || event.startTime)),
      toInterval(timeToDate(thisActivity.startTime), timeToDate(thisActivity.endTime)),
    )

    return re
  }
}
