import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'

export class PrisonPayBands {}

export default class PrisonPayBandsRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const prisonPayBands: PrisonPayBands[] = await this.activitiesService.getPayBandsForPrison(user)

    res.render('pages/activities/administration/prison-pay-bands', {
      prisonPayBands,
    })
  }
}
