import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'

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
    return res.redirect('./view')
  }
}
