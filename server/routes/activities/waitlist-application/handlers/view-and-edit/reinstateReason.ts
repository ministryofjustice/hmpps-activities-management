import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'
import { WaitingListStatus } from '../../../../../enum/waitingListStatus'

export class ReinstateReasonForm {
  @Expose()
  @IsNotEmpty({ message: 'Enter the reason' })
  reinstateReason: string
}

export default class ReinstateReasonRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => {
    return res.render('pages/activities/waitlist-application/reinstate-reason', {})
  }

  POST = async (req: Request, res: Response) => {
    const { applicationId } = req.params
    const { reinstateReason } = req.body
    const { user } = res.locals
    const request = {
      status: WaitingListStatus.PENDING,
      comments: reinstateReason as string,
    }

    await this.activitiesService.patchWaitlistApplication(+applicationId, request, user)

    return res.redirectWithSuccess(
      './view',
      `You have updated the status of ${req.journeyData.waitListApplicationJourney.prisoner.name}'s application`,
    )
  }
}
