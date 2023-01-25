import { Request, Response } from 'express'
import { Expose, Transform, Type } from 'class-transformer'
import { IsNumber, Min } from 'class-validator'
import PrisonService from '../../../services/prisonService'
import HasAtLeastOne from '../../../validators/hasAtLeastOne'
import ActivitiesService from '../../../services/activitiesService'
import IsNotDuplicatedForIep from '../../../validators/bandNotDuplicatedForIep'

export class Pay {
  @Expose()
  @Type(() => Number)
  @Transform(({ value }) => value * 100) // Transform to pence
  @IsNumber({ allowNaN: false }, { message: 'Pay rate must be a number' })
  @Min(1, { message: 'Enter a pay rate' })
  rate: number

  @Expose()
  @Type(() => Number)
  @Min(1, { message: 'Select a pay band' })
  @IsNotDuplicatedForIep({ message: 'A rate for the selected band and incentive level already exists' })
  bandId: number

  @Expose()
  @Transform(({ value }) => [value].flat()) // Transform to an array if only one value is provided
  @HasAtLeastOne({ message: 'Select at least one incentive level' })
  incentiveLevels: string[]
}

export default class PayRoutes {
  constructor(private readonly prisonService: PrisonService, private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const [incentiveLevels, payBands] = await Promise.all([
      this.prisonService.getIncentiveLevels(user.activeCaseLoadId, user).then(levels => levels.filter(l => l.active)),
      this.activitiesService.getPayBandsForPrison(user),
    ])

    res.render(`pages/create-an-activity/pay`, { incentiveLevels, payBands })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { rate, bandId, incentiveLevels } = req.body

    if (!req.session.createJourney.pay) {
      req.session.createJourney.pay = []
    }

    const [bandAlias, displaySequence] = await this.activitiesService
      .getPayBandsForPrison(user)
      .then(bands => bands.find(band => band.id === bandId))
      .then(band => [band.alias, band.displaySequence])

    req.session.createJourney.pay.push(
      ...incentiveLevels.map((incentiveLevel: string) => ({
        incentiveLevel,
        rate,
        bandId,
        bandAlias,
        displaySequence,
      })),
    )

    res.redirect('check-pay')
  }
}
