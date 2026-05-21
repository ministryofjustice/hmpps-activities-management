import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import ActivitiesService from '../../../../../services/activitiesService'
import { convertToNumberArray } from '../../../../../utils/utils'

enum IssuePayOptions {
  YES = 'yes',
  NO = 'no',
}

export class SessionPayMultipleForm {
  @Expose()
  @IsIn(Object.values(IssuePayOptions), {
    message: 'Select if people should be paid for these cancelled sessions',
  })
  issuePayOption: string
}
export default class CancelMultipleSessionsPayRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { selectedInstanceIds } = req.journeyData.recordAttendanceJourney

    const instances = await this.activitiesService.getScheduledActivities(
      convertToNumberArray(selectedInstanceIds),
      user,
    )

    res.render('pages/activities/record-attendance/cancel-multiple-sessions/payment', {
      allPaid: instances.every(a => a.activitySchedule.activity.paid),
      hasExternalEmployerPaid: instances.some(
        a => a.activitySchedule.activity.outsideWork && !a.activitySchedule.activity.paid,
      ),
      paidActivities: instances.filter(a => a.activitySchedule.activity.paid).map(a => a.activitySchedule.activity),
      allActivities: instances.map(a => a.activitySchedule.activity),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.journeyData.recordAttendanceJourney.sessionCancellationMultiple.issuePayment = req.body.issuePayOption === 'yes'
    return res.redirect(`check-answers`)
  }
}
