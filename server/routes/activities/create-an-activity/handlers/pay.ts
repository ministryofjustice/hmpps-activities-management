import { Request, Response } from 'express'
import { Expose, Transform, Type } from 'class-transformer'
import { IsNotEmpty, IsNumber, Min, ValidateIf, ValidationArguments } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import ActivitiesService from '../../../../services/activitiesService'
import IsNotDuplicatedForIep from '../../../../validators/bandNotDuplicatedForIep'
import PayRateBetweenMinAndMax from '../../../../validators/payRateBetweenMinAndMax'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import { CreateAnActivityJourney } from '../journey'

export class Pay {
  @Expose()
  @Type(() => Number)
  @Transform(({ value }) => value * 100) // Transform to pence
  @IsNumber({ allowNaN: false }, { message: 'Pay rate must be a number' })
  @Min(1, { message: 'Enter a pay rate' })
  @PayRateBetweenMinAndMax({
    message: (args: ValidationArguments) => {
      const { createJourney } = args.object as { createJourney: CreateAnActivityJourney }
      const { minimumPayRate, maximumPayRate } = createJourney
      return `Enter a pay amount that is at least £${minimumPayRate / 100} (minimum pay) and no more than £${
        maximumPayRate / 100
      } (maximum pay)`
    },
  })
  rate: number

  @Expose()
  @Type(() => Number)
  @Min(1, { message: 'Select a pay band' })
  @IsNotDuplicatedForIep({
    message:
      'You can only use each pay band once for an incentive level. Select a pay band which has not already been used',
  })
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

    const [incentiveLevels, payBands, payProfile] = await Promise.all([
      this.prisonService.getIncentiveLevels(user.activeCaseLoadId, user),
      this.activitiesService.getPayBandsForPrison(user),
      this.prisonService.getPayProfile(user.activeCaseLoadId),
    ])

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
    const { preserveHistory } = req.query
    const { rate, incentiveLevel, bandId } = req.body

    // Remove any existing pay rates with the same iep and band to avoid duplication
    const singlePayIndex = req.session.createJourney.pay.findIndex(
      p => p.bandId === +originalBandId && p.incentiveLevel === originalIncentiveLevel,
    )
    const flatPayIndex = req.session.createJourney.flat.findIndex(p => p.bandId === +originalBandId)
    if (singlePayIndex >= 0) req.session.createJourney.pay.splice(singlePayIndex, 1)
    if (flatPayIndex >= 0) req.session.createJourney.flat.splice(flatPayIndex, 1)

    const [band, allIncentiveLevels] = await Promise.all([
      this.activitiesService
        .getPayBandsForPrison(user)
        .then(bands => bands.find(b => b.id === bandId))
        .then(b => [b.alias, b.displaySequence]),
      this.prisonService.getIncentiveLevels(user.activeCaseLoadId, user),
    ])

    const [bandAlias, displaySequence] = band

    const newRate = {
      rate: +rate,
      bandId,
      bandAlias: String(bandAlias),
      displaySequence: +displaySequence,
    }

    if (payRateType === 'single') {
      req.session.createJourney.pay.push({
        ...newRate,
        incentiveNomisCode: allIncentiveLevels.find(s2 => s2.levelName === incentiveLevel).levelCode,
        incentiveLevel,
      })
    } else {
      req.session.createJourney.flat.push({ ...newRate })
    }

    if (req.params.mode === 'edit') await this.updatePay(req, res)
    else res.redirect(`../check-pay${preserveHistory ? '?preserveHistory=true' : ''}`)
  }

  updatePay = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { activityId } = req.session.createJourney

    const activityPay = req.session.createJourney.pay ?? []
    const activityFlatPay = req.session.createJourney.flat ?? []

    const incentiveLevels = await this.prisonService.getIncentiveLevels(user.activeCaseLoadId, user)

    if (activityFlatPay && activityFlatPay.length > 0) {
      const flatPayRates = activityFlatPay.flatMap(flatRate =>
        incentiveLevels.flatMap(iep => ({
          ...flatRate,
          incentiveNomisCode: iep.levelCode,
          incentiveLevel: iep.levelName,
        })),
      )

      activityPay.push(...flatPayRates)
      req.session.createJourney.flat = []
    }

    const updatedPayRates = activityPay.map(p => ({
      incentiveNomisCode: p.incentiveNomisCode,
      incentiveLevel: p.incentiveLevel,
      payBandId: p.bandId,
      rate: p.rate,
    }))

    const minimumIncentiveLevel =
      incentiveLevels.find(l => updatedPayRates.find(p => p.incentiveLevel === l.levelName)) ?? incentiveLevels[0]

    req.session.createJourney.minimumIncentiveNomisCode = minimumIncentiveLevel.levelCode
    req.session.createJourney.minimumIncentiveLevel = minimumIncentiveLevel.levelName

    const updatedActivity = {
      pay: updatedPayRates,
      minimumIncentiveNomisCode: req.session.createJourney.minimumIncentiveNomisCode,
      minimumIncentiveLevel: req.session.createJourney.minimumIncentiveLevel,
    } as ActivityUpdateRequest
    await this.activitiesService.updateActivity(user.activeCaseLoadId, activityId, updatedActivity)
    const successMessage = `We've updated the pay for ${req.session.createJourney.name}`

    return res.redirectWithSuccess('../schedule/check-pay?preserveHistory=true', 'Activity updated', successMessage)
  }
}
