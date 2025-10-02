import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'
import { convertToArray } from '../../../../../utils/utils'

export default class CancelSingleSessionsCheckAnswersRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { activityDate, sessionFilters, sessionCancellationSingle } = req.journeyData.recordAttendanceJourney

    const sessionFiltersString = sessionFilters ? convertToArray(sessionFilters).join(',') : ''
    const activitiesRedirectUrl = `../../activities?date=${activityDate}&sessionFilters=${sessionFiltersString}&preserveHistory=true`

    res.render('pages/activities/record-attendance/cancel-single-session/check-answers', {
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

    await this.activitiesService.cancelScheduledActivity(+selectedInstanceIds[0], sessionCancellationSingle, user)

    const sessionFiltersString = sessionFilters ? convertToArray(sessionFilters).join(',') : ''
    res.redirect(`../../activities?date=${activityDate}&sessionFilters=${sessionFiltersString}`)
  }
}
