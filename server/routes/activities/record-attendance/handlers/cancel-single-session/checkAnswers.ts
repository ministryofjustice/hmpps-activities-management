import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'
import { convertToArray, convertToNumberArray } from '../../../../../utils/utils'

export default class CancelSingleSessionsCheckAnswersRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    if (!req.journeyData.recordAttendanceJourney.sessionCancellationSingle) {
      return res.redirect('/activities/attendance')
    }
    const { activityDate, sessionFilters, sessionCancellationSingle } = req.journeyData.recordAttendanceJourney
    const sessionFiltersString = sessionFilters ? convertToArray(sessionFilters).join(',') : ''
    const activitiesRedirectUrl = `../../activities?date=${activityDate}&sessionFilters=${sessionFiltersString}&preserveHistory=true`

    return res.render('pages/activities/record-attendance/cancel-single-session/check-answers', {
      activityName: sessionCancellationSingle.activityName,
      comment: sessionCancellationSingle.comment,
      reason: sessionCancellationSingle.reason,
      issuePayment: sessionCancellationSingle.issuePayment,
      activitiesRedirectUrl,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { activityDate, sessionFilters, selectedInstanceIds, sessionCancellationSingle } =
      req.journeyData.recordAttendanceJourney

    const { reason, issuePayment, comment } = sessionCancellationSingle

    await this.activitiesService.cancelScheduledActivities(
      convertToNumberArray(selectedInstanceIds),
      reason,
      issuePayment,
      user,
      comment,
    )

    const sessionFiltersString = sessionFilters ? convertToArray(sessionFilters).join(',') : ''
    res.redirect(`../../activities?date=${activityDate}&sessionFilters=${sessionFiltersString}`)
  }
}
