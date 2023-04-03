import { Request, Response } from 'express'
import { areIntervalsOverlapping, parse } from 'date-fns'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import ActivitiesService from '../../../services/activitiesService'
import PrisonService from '../../../services/prisonService'
import { toDate } from '../../../utils/utils'
import { ScheduledActivity, ScheduledEvent } from '../../../@types/activitiesAPI/types'
import AttendanceReason from '../../../enum/attendanceReason'
import AttendanceStatus from '../../../enum/attendanceStatus'

enum EditAttendanceOptions {
  YES = 'yes',
  NO = 'no',
  REMOVE = 'remove',
}

export class EditAttendance {
  @Expose()
  @IsIn(Object.values(EditAttendanceOptions), { message: 'Select an attendance option' })
  attendanceOption: string
}

export default class EditAttendanceRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { id } = req.params
    const { attendanceId } = req.params

    const instance = await this.activitiesService.getScheduledActivity(+id, user)

    const attendance = await this.activitiesService.getAttendanceDetails(+attendanceId, user)

    const attendee = await this.prisonService
      .getInmateByPrisonerNumber(attendance.prisonerNumber, user)
      .then(i => ({ name: `${i.firstName} ${i.lastName}` }))

    res.render('pages/record-attendance/edit-attendance', { instance, attendance, attendee })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { id } = req.params
    const { attendanceId } = req.params
    if (req.body.attendanceOption === EditAttendanceOptions.YES) {
      const attendances = [
        {
          id: +attendanceId,
          status: AttendanceStatus.COMPLETED,
          attendanceReason: AttendanceReason.ATTENDED,
          issuePayment: true,
        },
      ]
      await this.activitiesService.updateAttendances(attendances, user)
      return res.redirect(`/attendance/activities/${id}/attendance-details/${attendanceId}`)
    }

    if (req.body.attendanceOption === EditAttendanceOptions.NO) {
      const [attendance, instance] = await Promise.all([
        this.activitiesService.getAttendanceDetails(+attendanceId, user),
        this.activitiesService.getScheduledActivity(+id, user),
      ])

      const otherScheduledEvents = await this.activitiesService
        .getScheduledEventsForPrisoners(toDate(instance.date), [attendance.prisonerNumber], user)
        .then(response => [
          ...response.activities,
          ...response.appointments,
          ...response.courtHearings,
          ...response.visits,
        ])
        .then(events => events.filter(e => e.eventId !== +id))
        .then(events => events.filter(e => this.eventClashes(e, instance)))

      const attendee = await this.prisonService.getInmateByPrisonerNumber(attendance.prisonerNumber, user).then(i => ({
        name: `${i.firstName} ${i.lastName}`,
        otherEvents: otherScheduledEvents.filter(e => e.prisonerNumber === i.prisonerNumber),
      }))
      req.session.notAttendedJourney = {}
      req.session.notAttendedJourney.selectedPrisoners = [
        {
          attendanceId: +attendanceId,
          prisonerNumber: attendance.prisonerNumber,
          prisonerName: attendee.name,
          otherEvents: attendee.otherEvents,
        },
      ]
      return res.redirect(`/attendance/activities/${id}/not-attended-reason`)
    }

    const attendances = [
      {
        id: +attendanceId,
        status: 'WAITING',
        attendanceReason: 'ATTENDED',
        issuePayment: false,
      },
    ]
    await this.activitiesService.updateAttendances(attendances, user)
    return res.redirect(`/attendance/activities/${id}/attendance-list`)
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
