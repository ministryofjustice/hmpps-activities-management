import { Request, Response } from 'express'
import ActivitiesService from '../../../services/activitiesService'
import { ActivityCreateRequest } from '../../../@types/activitiesAPI/types'
import PrisonService from '../../../services/prisonService'
import IncentiveLevelPayMappingUtil from './helpers/incentiveLevelPayMappingUtil'

export default class CheckAnswersRoutes {
  private readonly helper: IncentiveLevelPayMappingUtil

  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {
    this.helper = new IncentiveLevelPayMappingUtil(prisonService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const incentiveLevelPays = await this.helper.getPayGroupedByIncentiveLevel(req, user)
    res.render(`pages/create-an-activity/check-answers`, { incentiveLevelPays })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { createJourney } = req.session

    const activity = {
      prisonCode: user.activeCaseLoadId,
      summary: createJourney.name,
      categoryId: createJourney.category.id,
      riskLevel: createJourney.riskLevel,
      minimumIncentiveLevel: createJourney.minimumIncentiveLevel,
      pay: createJourney.pay.map(pay => ({
        incentiveLevel: pay.incentiveLevel,
        payBandId: pay.bandId,
        rate: pay.rate,
      })),
    } as ActivityCreateRequest

    const response = await this.activitiesService.createActivity(activity, user)
    res.redirect(`confirmation/${response.id}`)
  }
}
