import { Request, Response } from 'express'
import { Expose, Transform, Type } from 'class-transformer'
import { IsNotEmpty, IsNumber, Min, ValidateIf, ValidationArguments } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import ActivitiesService from '../../../../services/activitiesService'
import IsNotDuplicatedForIep from '../../../../validators/bandNotDuplicatedForIep'
import PayRateBetweenMinAndMax from '../../../../validators/payRateBetweenMinAndMax'
import { ActivityPay, ActivityUpdateRequest, PrisonPayBand } from '../../../../@types/activitiesAPI/types'
import { CreateAnActivityJourney } from '../journey'
import { IncentiveLevel } from '../../../../@types/incentivesApi/types'
import { AgencyPrisonerPayProfile } from '../../../../@types/prisonApiImport/types'
import IncentiveLevelPayMappingUtil from '../../../../utils/helpers/incentiveLevelPayMappingUtil'

export class Pay {
  @Expose()
  @Type(() => Number)
  @Transform(({ value }) => Math.round(value * 100)) // Transform to pence
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
  private readonly helper: IncentiveLevelPayMappingUtil

  constructor(private readonly prisonService: PrisonService, private readonly activitiesService: ActivitiesService) {
    this.helper = new IncentiveLevelPayMappingUtil(prisonService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { payRateType } = req.params
    const { iep, bandId } = req.query
    const { createJourney } = req.session

    const [incentiveLevels, payBands, payProfile]: [IncentiveLevel[], PrisonPayBand[], AgencyPrisonerPayProfile] =
      await Promise.all([
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
      req.session.createJourney?.pay?.find(p => p.prisonPayBand.id === +bandId && p.incentiveLevel === iep)?.rate ||
      req.session.createJourney?.flat?.find(p => p.prisonPayBand.id === +bandId)?.rate

    const hasAllocations = await this.helper
      .getPayGroupedByIncentiveLevel(createJourney.pay, createJourney.allocations, user)
      .then(pays => pays.find(p => p.incentiveLevel === iep)?.pays)
      .then(pays => pays?.find(p => p.prisonPayBand.id === +bandId).allocationCount > 0)

    const band = payBands.find(p => p.id === +bandId)

    res.render(`pages/activities/create-an-activity/pay`, {
      rate,
      iep,
      band,
      payRateType,
      incentiveLevels,
      payBands,
      minimumPayRate,
      maximumPayRate,
      hasAllocations,
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
      p => p.prisonPayBand.id === +originalBandId && p.incentiveLevel === originalIncentiveLevel,
    )
    const flatPayIndex = req.session.createJourney.flat.findIndex(p => p.prisonPayBand.id === +originalBandId)
    if (singlePayIndex >= 0) req.session.createJourney.pay.splice(singlePayIndex, 1)
    if (flatPayIndex >= 0) req.session.createJourney.flat.splice(flatPayIndex, 1)

    const [band, allIncentiveLevels]: [(string | number)[], IncentiveLevel[]] = await Promise.all([
      this.activitiesService
        .getPayBandsForPrison(user)
        .then(bands => bands.find(b => b.id === bandId))
        .then(b => [b.alias, b.displaySequence]),
      this.prisonService.getIncentiveLevels(user.activeCaseLoadId, user),
    ])

    const [bandAlias, displaySequence] = band

    const newRate = {
      rate: +rate,
      prisonPayBand: { id: bandId, alias: String(bandAlias), displaySequence: +displaySequence },
      incentiveNomisCode: allIncentiveLevels.find(s2 => s2.levelName === incentiveLevel)?.levelCode,
      incentiveLevel,
    } as ActivityPay

    if (payRateType === 'single') {
      req.session.createJourney.pay.push(newRate)
    } else {
      req.session.createJourney.flat.push(newRate)
    }

    if (req.params.mode === 'edit') await this.updatePay(req, res)
    else res.redirect(`../check-pay${preserveHistory ? '?preserveHistory=true' : ''}`)
  }

  updatePay = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { activityId } = req.session.createJourney
    const { payRateType } = req.params

    const activityPay = req.session.createJourney.pay ?? []
    const activityFlatPay = req.session.createJourney.flat ?? []

    const flatRateBandAlias = activityFlatPay.find(p => p.prisonPayBand.id === req.body.bandId)?.prisonPayBand?.alias
    const singlePayBandAlias = activityPay.find(p => p.prisonPayBand.id === req.body.bandId)?.prisonPayBand?.alias

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
      payBandId: p.prisonPayBand.id,
      rate: p.rate,
    }))

    const updatedActivity = {
      paid: true,
      pay: updatedPayRates,
    } as ActivityUpdateRequest
    await this.activitiesService.updateActivity(user.activeCaseLoadId, activityId, updatedActivity)

    const activity = await this.activitiesService.getActivity(+activityId, res.locals.user)
    req.session.createJourney.allocations = activity.schedules.flatMap(s =>
      s.allocations.filter(a => a.status !== 'ENDED'),
    )

    const affectedAllocations = await this.helper
      .getPayGroupedByIncentiveLevel(req.session.createJourney.pay, req.session.createJourney.allocations, user)
      .then(pays => pays.find(p => p.incentiveLevel === req.body.incentiveLevel)?.pays)
      .then(pays => pays?.find(p => p.prisonPayBand.id === +req.body.bandId).allocationCount)

    let successMessage
    if (payRateType === 'flat') {
      successMessage = `You've added a flat rate for ${flatRateBandAlias}`
    } else if (!req.query.bandId && !req.query.iep) {
      successMessage = `You've added a pay rate for ${req.body.incentiveLevel} incentive level: ${singlePayBandAlias}`
    } else if (affectedAllocations > 0) {
      successMessage = `You've changed ${req.body.incentiveLevel} incentive level: ${singlePayBandAlias}. There are ${affectedAllocations} people 
          assigned to this pay rate. Your changes will take effect from tomorrow.`
    } else {
      successMessage = `You've changed ${req.body.incentiveLevel} incentive level: ${singlePayBandAlias}.`
    }

    return res.redirectWithSuccess('../check-pay?preserveHistory=true', 'Activity updated', successMessage)
  }
}
