import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { AdvanceAttendance, ScheduledActivity } from '../../../../@types/activitiesAPI/types'
import { convertToTitleCase } from '../../../../utils/utils'
import config from '../../../../config'

export default class AdvanceAttendanceChangePayRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    if (!config.notRequiredInAdvanceEnabled) {
      return res.redirect('attendance-list')
    }
    const { user } = res.locals
    const { id } = req.params
    const { advanceAttendanceId } = req.params

    const [instance, advanceAttendance]: [ScheduledActivity, AdvanceAttendance] = await Promise.all([
      this.activitiesService.getScheduledActivity(+id, user),
      this.activitiesService.getAdvanceAttendanceDetails(+advanceAttendanceId, user),
    ])

    const attendee = await this.prisonService.getInmateByPrisonerNumber(advanceAttendance.prisonerNumber, user)

    return res.render('pages/activities/record-attendance/advance-attendance-change-pay', {
      instance,
      advanceAttendance,
      attendee,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { advanceAttendanceId } = req.params

    const advanceAttendance: AdvanceAttendance = await this.activitiesService.getAdvanceAttendanceDetails(
      +advanceAttendanceId,
      user,
    )

    const newIssuePayment = !advanceAttendance.issuePayment
    const attendee = await this.prisonService.getInmateByPrisonerNumber(advanceAttendance.prisonerNumber, user)

    await this.activitiesService.putAdvanceAttendance(+advanceAttendanceId, newIssuePayment, user)
    const successMessage = `${convertToTitleCase(`${attendee.firstName} ${attendee.lastName}`)} will now${newIssuePayment ? ' ' : ' not '}be paid for this session.`
    return res.redirectWithSuccess('../../attendance-list', 'Pay updated', successMessage)
  }
}
