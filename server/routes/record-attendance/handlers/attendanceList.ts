import { Request, Response } from 'express'
import { areIntervalsOverlapping, parse } from 'date-fns'
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
  selectedPrisoners: string[]
}

export default class AttendanceListRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const instanceId = req.params.id
    const { user } = res.locals

    const instance = await this.activitiesService.getScheduledActivity(+instanceId, user)
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
        attendanceLabel: this.getAttendanceLabel(i.offenderNo, instance.attendances),
      })),
    )

    return res.render('pages/record-attendance/attendance-list', {
      activity: {
        name: instance.activitySchedule.activity.summary,
        location: instance.activitySchedule.internalLocation.description,
        time: `${instance.startTime} - ${instance.endTime}`,
        date: toDate(instance.date),
        ...getAttendanceSummary(instance.attendances),
      },
      attendees,
    })
  }

  ATTENDED = async (req: Request, res: Response): Promise<void> => {
    res.status(419)
    res.send('ATTENDED : Under construction 🛠️')
  }

  NOT_ATTENDED = async (req: Request, res: Response): Promise<void> => {
    res.status(419)
    res.send('NOT ATTENDED : Under construction 🛠️')
  }

  private getAttendanceLabel = (prisonerNumber: string, attendances: Attendance[]) => {
    const attendance = attendances.find(a => a.prisonerNumber === prisonerNumber)
    if (attendance.status === 'SCHEDULED') {
      return 'Not recorded yet'
    }
    return attendance.attendanceReason.code === 'ATT' ? 'Attended' : 'Absent'
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
