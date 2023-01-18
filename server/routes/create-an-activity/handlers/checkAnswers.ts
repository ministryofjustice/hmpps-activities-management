import { Request, Response } from 'express'
import ActivitiesService from '../../../services/activitiesService'
import { ActivityCreateRequest } from '../../../@types/activitiesAPI/types'

export default class CheckAnswersRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render(`pages/create-an-activity/check-answers`)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { createJourney } = req.session

    const activity = {
      prisonCode: user.activeCaseLoadId,
      summary: createJourney.name,
      categoryId: createJourney.category.id,
      riskLevel: createJourney.riskLevel,
      minimumIncentiveLevel: createJourney.minimumIncentive,

      // TODO: The logic in this pay section will be replaced by a pay screen
      pay: createJourney.incentiveLevels.flatMap(l => [
        {
          incentiveLevel: l,
          payBand: 'A',
          rate: 125,
          pieceRate: 125,
          pieceRateItems: 10,
        },
        {
          incentiveLevel: l,
          payBand: 'B',
          rate: 150,
          pieceRate: 150,
          pieceRateItems: 10,
        },
      ]),
    } as ActivityCreateRequest

    const response = await this.activitiesService.createActivity(activity, user)
    res.redirect(`confirmation/${response.id}`)
  }
}
