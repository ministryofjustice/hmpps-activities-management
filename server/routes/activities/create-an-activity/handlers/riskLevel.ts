import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'

enum RiskLevelOptions {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export class RiskLevel {
  @Expose()
  @IsIn(Object.values(RiskLevelOptions), { message: 'Select a risk level for the activity' })
  riskLevel: RiskLevelOptions
}

export default class RiskLevelRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render(`pages/create-an-activity/risk-level`)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.createJourney.riskLevel = req.body.riskLevel
    if (req.query && req.query.fromEditActivity) {
      const { user } = res.locals
      const { activityId } = req.session.createJourney
      const prisonCode = user.activeCaseLoadId
      const activity = {
        riskLevel: req.session.createJourney.riskLevel,
      } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(prisonCode, activityId, activity)
      const successMessage = `We've updated the risk assessment level for ${req.session.createJourney.name}`

      const returnTo = `/activities/schedule/activities/${req.session.createJourney.activityId}`
      req.session.returnTo = returnTo
      res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
    } else res.redirectOrReturn(`pay-rate-type`)
  }
}
