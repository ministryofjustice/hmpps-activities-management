import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../services/prisonService'

export class MinIncentiveLevel {
  @Expose()
  @IsNotEmpty({ message: 'Select a minimum incentive level' })
  minimumIncentive: string
}

export default class MinimumIncentiveRoutes {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const incentiveLevels = await this.prisonService
      .getIncentiveLevels(user.activeCaseLoadId, user)
      .then(levels => levels.filter(l => l.active))

    res.render(`pages/create-an-activity/minimum-incentive`, { incentiveLevels })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    req.session.createJourney.minimumIncentive = req.body.minimumIncentive
    req.session.createJourney.incentiveLevels = await this.prisonService
      .getIncentiveLevels(user.activeCaseLoadId, user)
      .then(levels => levels.filter(l => l.active))
      .then(levels => {
        const selectedLevelSequence = levels.find(l => l.iepDescription === req.body.minimumIncentive)?.sequence
        return levels.filter(l => l.sequence >= selectedLevelSequence)
      })
      .then(levels => levels.map(l => l.iepDescription))

    res.redirectOrReturn(`check-answers`)
  }
}
