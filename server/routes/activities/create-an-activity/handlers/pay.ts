import { Request, Response } from 'express'
import { Expose, Transform, Type } from 'class-transformer'
import { IsNumber, Min } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import ActivitiesService from '../../../../services/activitiesService'
import IsNotDuplicatedForIep from '../../../../validators/bandNotDuplicatedForIep'
import IsNotDuplicatedForFlat from '../../../../validators/bandNotDuplicatedForFlat'
import PayRateBetweenMinAndMax from '../../../../validators/payRateBetweenMinAndMax'

export class Pay {
  @Expose()
  @Type(() => Number)
  @Transform(({ value }) => value * 100) // Transform to pence
  @IsNumber({ allowNaN: false }, { message: 'Pay rate must be a number' })
  @Min(1, { message: 'Enter a pay rate' })
  @PayRateBetweenMinAndMax({
    message: `Enter a pay amount that is at least the minimum pay and no more than maximum pay`,
  })
  rate: number

  @Expose()
  @Type(() => Number)
  @Min(1, { message: 'Select a pay band' })
  @IsNotDuplicatedForIep({ message: 'A rate for the selected band and incentive level already exists' })
  @IsNotDuplicatedForFlat({ message: 'A rate for the selected band already exists' })
  bandId: number

  @Expose()
  @Transform(({ value }) => [value].flat()) // Transform to an array if only one value is provided
  incentiveLevels: string[]
}

export default class PayRoutes {
  constructor(private readonly prisonService: PrisonService, private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { iep } = req.query
    const bandId = +req.query.bandId

    const pay = req.session.createJourney?.pay?.find(p => p.bandId === bandId && p.incentiveLevel === iep)
    const flat = req.session.createJourney?.flat?.find(p => p.bandId === bandId)
    const payRateType = req.session.createJourney.payRateTypeOption

    const [incentiveLevels, payBands] = await Promise.all([
      this.prisonService.getIncentiveLevels(user.activeCaseLoadId, user),
      this.activitiesService.getPayBandsForPrison(user),
    ])

    const payProfile = await this.prisonService.getPayProfile(user.activeCaseLoadId)

    const minimumPayRate = payProfile.minHalfDayRate * 100
    const maximumPayRate = payProfile.maxHalfDayRate * 100

    req.session.createJourney.minimumPayRate = minimumPayRate
    req.session.createJourney.maximumPayRate = maximumPayRate

    res.render(`pages/create-an-activity/pay`, {
      incentiveLevels,
      payBands,
      pay,
      flat,
      payRateType,
      minimumPayRate,
      maximumPayRate,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { rate, incentiveLevel, currentIncentiveLevel } = req.body
    const bandId = +req.body.bandId
    const currentPayBand = +req.body.currentPayBand

    if (!req.session.createJourney.pay) {
      req.session.createJourney.pay = []
    }
    if (!req.session.createJourney.flat) {
      req.session.createJourney.flat = []
    }

    // Remove the current pay rate to prevent duplicate pay rates
    const payIndex = req.session.createJourney.pay.findIndex(
      p => p.bandId === currentPayBand && p.incentiveLevel === currentIncentiveLevel,
    )
    if (payIndex >= 0) req.session.createJourney.pay.splice(payIndex, 1)
    const flatIndex = req.session.createJourney.flat.findIndex(p => p.bandId === currentPayBand)
    if (flatIndex >= 0) req.session.createJourney.flat.splice(flatIndex, 1)

    const [bandAlias, displaySequence] = await this.activitiesService
      .getPayBandsForPrison(user)
      .then(bands => bands.find(band => band.id === bandId))
      .then(band => [band.alias, band.displaySequence])

    const allIncentiveLevels = await this.prisonService.getIncentiveLevels(user.activeCaseLoadId, user)

    if (req.session.createJourney.payRateTypeOption === 'single' || req.query.iep) {
      req.session.createJourney.pay.push({
        incentiveNomisCode: allIncentiveLevels.find(s2 => s2.levelName === incentiveLevel).levelCode,
        incentiveLevel,
        rate: +rate,
        bandId,
        bandAlias: String(bandAlias),
        displaySequence: +displaySequence,
      })
    } else {
      req.session.createJourney.flat.push({
        rate: +rate,
        bandId,
        bandAlias: String(bandAlias),
        displaySequence: +displaySequence,
      })
    }
    if (req.query.fromEditActivity) res.redirect('/activities/schedule/check-pay?preserveHistory=true')
    else res.redirect('check-pay')
  }
}
