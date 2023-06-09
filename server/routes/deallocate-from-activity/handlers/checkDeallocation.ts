import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import ActivitiesService from '../../../services/activitiesService'
import { formatDate } from '../../../utils/utils'
import SimpleDate from '../../../commonValidationTypes/simpleDate'

export default class CheckDeallocationRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { deallocationDate, deallocationReason } = req.session.deallocateJourney

    const deallocationReasons = await this.activitiesService.getDeallocationReasons(user)

    res.render('pages/deallocate-from-activity/check-answers', {
      deallocationDate: formatDate(plainToInstance(SimpleDate, deallocationDate).toRichDate(), 'yyyy-MM-dd'),
      deallocationReason: deallocationReasons.find(r => r.code === deallocationReason).description,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { deallocateJourney } = req.session
    const { user } = res.locals
    await this.activitiesService.deallocateFromActivity(deallocateJourney, user)
    res.redirect('confirmation')
  }
}
