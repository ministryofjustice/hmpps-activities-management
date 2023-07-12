import { Request, Response } from 'express'
import { Expose, Transform, Type } from 'class-transformer'
import { IsNotEmpty, IsNumber, Min, ValidateIf } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import ActivitiesService from '../../../../services/activitiesService'
import IsNotDuplicatedForIep from '../../../../validators/bandNotDuplicatedForIep'
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
  @IsNotDuplicatedForIep({ message: 'A rate for the selected band and incentive level combination already exists' })
  bandId: number

  @Expose()
  @ValidateIf(o => o.pathParams.payRateType === 'single')
  @IsNotEmpty({ message: 'Select an incentive level for the pay rate' })
  incentiveLevel: string
}

export default class PayRoutes {
  constructor(private readonly prisonService: PrisonService, private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { payRateType } = req.params
    const { iep, bandId } = req.query

    const [incentiveLevels, payBands] = await Promise.all([
      this.prisonService.getIncentiveLevels(user.activeCaseLoadId, user),
      this.activitiesService.getPayBandsForPrison(user),
    ])

    const payProfile = await this.prisonService.getPayProfile(user.activeCaseLoadId)

    const minimumPayRate = payProfile.minHalfDayRate * 100
    const maximumPayRate = payProfile.maxHalfDayRate * 100

    req.session.createJourney.pay ??= []
    req.session.createJourney.flat ??= []
    req.session.createJourney.minimumPayRate = minimumPayRate
    req.session.createJourney.maximumPayRate = maximumPayRate

    const rate =
      req.session.createJourney?.pay?.find(p => p.bandId === +bandId && p.incentiveLevel === iep)?.rate ||
      req.session.createJourney?.flat?.find(p => p.bandId === +bandId)?.rate

    res.render(`pages/activities/create-an-activity/pay`, {
      rate,
      iep,
      bandId,
      payRateType,
      incentiveLevels,
      payBands,
      minimumPayRate,
      maximumPayRate,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { payRateType } = req.params
    const originalBandId = req.query.bandId
    const originalIncentiveLevel = req.query.iep
    const { rate, incentiveLevel, bandId } = req.body

    // Remove any existing pay rates with the same iep and band to avoid duplication
    const singlePayIndex = req.session.createJourney.pay.findIndex(
      p => p.bandId === +originalBandId && p.incentiveLevel === originalIncentiveLevel,
    )
    const flatPayIndex = req.session.createJourney.flat.findIndex(p => p.bandId === +originalBandId)
    if (singlePayIndex >= 0) req.session.createJourney.pay.splice(singlePayIndex, 1)
    if (flatPayIndex >= 0) req.session.createJourney.flat.splice(flatPayIndex, 1)

    const [bandAlias, displaySequence] = await this.activitiesService
      .getPayBandsForPrison(user)
      .then(bands => bands.find(band => band.id === bandId))
      .then(band => [band.alias, band.displaySequence])

    const allIncentiveLevels = await this.prisonService.getIncentiveLevels(user.activeCaseLoadId, user)

    if (payRateType === 'single') {
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
    else res.redirect('../check-pay')
  }
}
