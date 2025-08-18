import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'
import EventTier from '../../../../enum/eventTiers'

enum RiskLevelOptions {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export class RiskLevel {
  @Expose()
  @IsIn(Object.values(RiskLevelOptions), { message: 'Select which workplace risk assessment levels are suitable' })
  riskLevel: RiskLevelOptions
}

export default class RiskLevelRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render(`pages/activities/create-an-activity/risk-level`)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.journeyData.createJourney.riskLevel = req.body.riskLevel
    if (req.routeContext.mode === 'edit') {
      const { user } = res.locals
      const { activityId } = req.journeyData.createJourney
      const activity = {
        riskLevel: req.journeyData.createJourney.riskLevel,
      } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(activityId, activity, user)
      const successMessage = `You've updated the risk assessment level for ${req.journeyData.createJourney.name}`

      const returnTo = `/activities/view/${req.journeyData.createJourney.activityId}`
      req.session.returnTo = returnTo
      return res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
    }

    if (req.journeyData.createJourney.tierCode === EventTier.FOUNDATION) {
      return res.redirectOrReturn('attendance-required')
    }
    return res.redirectOrReturn('pay-option')
  }
}
