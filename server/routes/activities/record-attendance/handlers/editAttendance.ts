import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { eventClashes, toDate } from '../../../../utils/utils'
import AttendanceReason from '../../../../enum/attendanceReason'
import AttendanceStatus from '../../../../enum/attendanceStatus'

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
    const { id, attendanceId } = req.params

    const [instance, attendance] = await Promise.all([
      this.activitiesService.getScheduledActivity(+id, user),
      this.activitiesService.getAttendanceDetails(+attendanceId),
    ])

    const prisoner = await this.prisonService.getInmateByPrisonerNumber(attendance.prisonerNumber, user)

    const attendee = {
      name: `${prisoner.firstName} ${prisoner.lastName}`,
    }

    res.render('pages/activities/record-attendance/edit-attendance', { instance, attendance, attendee })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { id, attendanceId } = req.params

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

      const returnUrl = req.journeyData.recordAttendanceJourney.singleInstanceSelected
        ? '../../attendance-list'
        : '../../../attendance-list'

      return res.redirect(returnUrl)
    }

    if (req.body.attendanceOption === EditAttendanceOptions.NO) {
      const [attendance, instance] = await Promise.all([
        this.activitiesService.getAttendanceDetails(+attendanceId),
        this.activitiesService.getScheduledActivity(+id, user),
      ])

      const [scheduledEvents, prisoner] = await Promise.all([
        this.activitiesService.getScheduledEventsForPrisoners(toDate(instance.date), [attendance.prisonerNumber], user),
        this.prisonService.getInmateByPrisonerNumber(attendance.prisonerNumber, user),
      ])

      const otherScheduledEvents = [
        ...scheduledEvents.activities,
        ...scheduledEvents.appointments,
        ...scheduledEvents.courtHearings,
        ...scheduledEvents.visits,
      ]
        .filter(event => !event.cancelled)
        .filter(event => event.scheduledInstanceId !== +id)
        .filter(event => eventClashes(event, instance))

      const otherEvents = otherScheduledEvents.filter(event => event.prisonerNumber === prisoner.prisonerNumber)

      req.journeyData.recordAttendanceJourney.notAttended = {
        selectedPrisoners: [
          {
            instanceId: +id,
            attendanceId: +attendanceId,
            prisonerNumber: attendance.prisonerNumber,
            prisonerName: `${prisoner.firstName} ${prisoner.lastName}`,
            firstName: prisoner.firstName,
            lastName: prisoner.lastName,
            otherEvents: otherEvents,
          },
        ],
      }

      return res.redirect('../../../not-attended-reason?preserveHistory=true')
    }

    // If not "yes" or "no", assume "reset"
    return res.redirect(`../../../${id}/attendance-details/${attendanceId}/reset-attendance`)
  }
}
