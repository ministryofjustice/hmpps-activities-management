import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'

export class DeallocationReason {
  @Expose()
  @IsNotEmpty({ message: 'Select a reason for deallocation' })
  deallocationReason: string
}

export default class DeallocationReasonRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const deallocationReasons = await this.activitiesService.getDeallocationReasons(user)

    res.render('pages/activities/deallocate-from-activity/deallocation-reason', { deallocationReasons })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { deallocationReason } = req.body
    req.session.deallocateJourney.deallocationReason = deallocationReason
    res.redirectOrReturn('check-answers')
  }
}
