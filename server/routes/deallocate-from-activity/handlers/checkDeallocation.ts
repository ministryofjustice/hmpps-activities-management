import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import ActivitiesService from '../../../services/activitiesService'
import SimpleDate from '../../../commonValidationTypes/simpleDate'

export default class CheckDeallocationRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { deallocationDate, deallocationReason } = req.session.deallocateJourney

    const deallocationReasons = await this.activitiesService.getDeallocationReasons(user)

    res.render('pages/deallocate-from-activity/check-answers', {
      deallocationDate: plainToInstance(SimpleDate, deallocationDate).toRichDate(),
      deallocationReason: deallocationReasons.find(r => r.code === deallocationReason).description,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    res.redirect('confirmation')
  }
}
