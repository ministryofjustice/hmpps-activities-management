import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'
import { convertToArray, convertToNumberArray, toDate } from '../../../../../utils/utils'

export default class CancelMultipleSessionsCheckAnswersRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { activityDate, sessionFilters, selectedInstanceIds, sessionCancellationMultiple } =
      req.session.recordAttendanceJourney

    const date = toDate(activityDate)
    const instances = await this.activitiesService.getScheduledActivities(
      convertToNumberArray(selectedInstanceIds),
      user,
    )
    const isPayable = instances[0].activitySchedule.activity.paid
    const sessionFiltersString = sessionFilters ? convertToArray(sessionFilters).join(',') : ''
    const activitiesRedirectUrl = `../../activities?date=${activityDate}&sessionFilters=${sessionFiltersString}&preserveHistory=true`

    res.render('pages/activities/record-attendance/cancel-multiple-sessions/check-answers', {
      instances,
      date,
      isPayable,
      reason: sessionCancellationMultiple.reason,
      issuePayment: sessionCancellationMultiple.issuePayment ? 'Yes' : 'No',
      activitiesRedirectUrl,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { activityDate, sessionFilters, selectedInstanceIds, sessionCancellationMultiple } =
      req.session.recordAttendanceJourney

    await this.activitiesService.cancelMultipleActivities(
      convertToNumberArray(selectedInstanceIds),
      sessionCancellationMultiple,
      user,
    )

    const sessionFiltersString = sessionFilters ? convertToArray(sessionFilters).join(',') : ''
    res.redirect(`../../activities?date=${activityDate}&sessionFilters=${sessionFiltersString}`)
  }
}
