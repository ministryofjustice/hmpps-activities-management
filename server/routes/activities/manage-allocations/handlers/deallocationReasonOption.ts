import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'

export class DeallocationReasonOption {
  @Expose()
  @IsNotEmpty({ message: 'Select if you want to change the reason' })
  deallocationReasonOption: string
}

export default class DeallocationReasonOptionRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const { deallocationReason } = req.journeyData.allocateJourney
    const deallocationReasons = await this.activitiesService.getDeallocationReasons(user)

    const reason = deallocationReasons.find(({ code }) => code === deallocationReason)

    const currentDeallocationReason = reason ? reason.description : 'Planned'

    res.render('pages/activities/manage-allocations/deallocation-reason-option', { currentDeallocationReason })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.body.deallocationReasonOption === 'yes') {
      return res.redirectOrReturn(`reason`)
    }
    return res.redirect(`check-answers`)
  }
}
