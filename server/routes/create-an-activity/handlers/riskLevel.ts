import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'

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
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render(`pages/create-an-activity/risk-level`)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.createJourney.riskLevel = req.body.riskLevel
    res.redirectOrReturn(`minimum-incentive`)
  }
}
