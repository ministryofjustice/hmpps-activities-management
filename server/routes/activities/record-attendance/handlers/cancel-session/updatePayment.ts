import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import ActivitiesService from '../../../../../services/activitiesService'

enum IssuePayOptions {
  YES = 'yes',
  NO = 'no',
}

export class SessionPayForm {
  @Expose()
  @IsIn(Object.values(IssuePayOptions), {
    message: 'Select if people should be paid for this cancelled session',
  })
  issuePayOption: string
}
export default class UpdateCancelledSessionPayRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/record-attendance/cancel-session/payment')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const instanceId = +req.params.id
    const issuePayment = req.body.issuePayOption === 'yes'
    const { user } = res.locals

    const updatedDetails = {
      issuePayment,
    }
    this.activitiesService.updateCancelledSession(instanceId, updatedDetails, user)
    // the detailsEdited query is so we know to use a hard coded back link on the view/edit cancellation details page
    return res.redirect(`../../cancel-multiple/view-edit-details/${instanceId}?detailsEdited=true`)
  }
}
