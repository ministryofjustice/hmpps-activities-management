import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'

export default class CheckAndConfirmMultipleRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => {
    res.render('pages/activities/manage-allocations/allocateMultiplePeople/checkAndConfirmMultiple')
  }

  POST = async (_req: Request, _res: Response): Promise<void> => {}
}
