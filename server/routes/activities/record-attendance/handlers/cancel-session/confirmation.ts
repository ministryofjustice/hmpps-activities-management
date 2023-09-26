import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'
import MetricsService from '../../../../../services/metricsService'
import MetricsEvent from '../../../../../data/MetricsEvent'
import AttendanceStatus from '../../../../../enum/attendanceStatus'
import AttendanceReason from '../../../../../enum/attendanceReason'

export class CancelConfirmForm {
  @Expose()
  @IsIn(['yes', 'no'], { message: 'Please confirm you want to cancel the session' })
  confirm: string
}

export default class CancelSessionRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly metricsService: MetricsService) {}

  GET = async (req: Request, res: Response) => res.render('pages/activities/record-attendance/cancel-session/confirm')

  POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    const instanceId = +req.params.id
    const { confirm }: CancelConfirmForm = req.body

    if (confirm === 'yes') {
      const sessionCancellationRequest = req.session.recordAttendanceRequests.sessionCancellation
      const [instance] = await Promise.all([
        this.activitiesService.getScheduledActivity(+instanceId, user),
        this.activitiesService.cancelScheduledActivity(instanceId, sessionCancellationRequest, user),
      ])

      instance.attendances
        .filter(a => a.status === AttendanceStatus.WAITING)
        .forEach(attendance =>
          this.metricsService.trackEvent(
            MetricsEvent.ATTENDANCE_RECORDED(instance, attendance.prisonerNumber, AttendanceReason.CANCELLED, user),
          ),
        )
    }

    res.redirect(`/activities/attendance/activities/${instanceId}/attendance-list`)
  }
}
