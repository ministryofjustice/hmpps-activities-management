import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { eventClashes, toDate } from '../../../../utils/utils'
import AttendanceReason from '../../../../enum/attendanceReason'
import AttendanceStatus from '../../../../enum/attendanceStatus'
import { Attendance, ScheduledActivity } from '../../../../@types/activitiesAPI/types'

enum EditAttendanceOptions {
  YES = 'yes',
  NO = 'no',
  RESET = 'reset',
}

export class EditAttendance {
  @Expose()
  @IsIn(Object.values(EditAttendanceOptions), {
    message: 'Select if you want to change the attendance, leave it or reset it',
  })
  attendanceOption: string
}

export default class EditAttendanceRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { id } = req.params
    const { attendanceId } = req.params

    const [instance, attendance]: [ScheduledActivity, Attendance] = await Promise.all([
      this.activitiesService.getScheduledActivity(+id, user),
      this.activitiesService.getAttendanceDetails(+attendanceId),
    ])

    const attendee = await this.prisonService
      .getInmateByPrisonerNumber(attendance.prisonerNumber, user)
      .then(i => ({ name: `${i.firstName} ${i.lastName}` }))

    res.render('pages/activities/record-attendance/edit-attendance', { instance, attendance, attendee })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { id } = req.params
    const { attendanceId } = req.params

    if (req.body.attendanceOption === EditAttendanceOptions.YES) {
      const attendances = [
        {
          id: +attendanceId,
          prisonCode: user.activeCaseLoadId,
          status: AttendanceStatus.COMPLETED,
          attendanceReason: AttendanceReason.ATTENDED,
          issuePayment: true,
        },
      ]
      await this.activitiesService.updateAttendances(attendances, user)

      const returnUrl = req.session.recordAttendanceJourney.singleInstanceSelected
        ? '../../attendance-list'
        : '../../../attendance-list'

      return res.redirect(returnUrl)
    }

    if (req.body.attendanceOption === EditAttendanceOptions.NO) {
      const attendance = await this.activitiesService.getAttendanceDetails(+attendanceId)
      const instance = await this.activitiesService.getScheduledActivity(+id, user)

      const otherScheduledEvents = await this.activitiesService
        .getScheduledEventsForPrisoners(toDate(instance.date), [attendance.prisonerNumber], user)
        .then(response => [
          ...response.activities,
          ...response.appointments,
          ...response.courtHearings,
          ...response.visits,
        ])
        .then(events => events.filter(e => !e.cancelled))
        .then(events => events.filter(e => e.scheduledInstanceId !== +id))
        .then(events => events.filter(e => eventClashes(e, instance)))

      const attendee = await this.prisonService.getInmateByPrisonerNumber(attendance.prisonerNumber, user).then(i => ({
        name: `${i.firstName} ${i.lastName}`,
        firstName: i.firstName,
        lastName: i.lastName,
        otherEvents: otherScheduledEvents.filter(e => e.prisonerNumber === i.prisonerNumber),
      }))
      req.session.recordAttendanceJourney.notAttended = {
        selectedPrisoners: [
          {
            instanceId: +id,
            attendanceId: +attendanceId,
            prisonerNumber: attendance.prisonerNumber,
            prisonerName: attendee.name,
            firstName: attendee.firstName,
            lastName: attendee.lastName,
            otherEvents: attendee.otherEvents,
          },
        ],
      }
      return res.redirect(`../../../not-attended-reason?preserveHistory=true`)
    }

    // If not "yes" or "no", assume "reset"
    return res.redirect(`../../../${id}/attendance-details/${attendanceId}/reset-attendance`)
  }
}
