import { Request, Response } from 'express'
import { addDays, startOfToday } from 'date-fns'
import { Expose } from 'class-transformer'
import PrisonService from '../../../../services/prisonService'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivityPay, ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import { IncentiveLevel } from '../../../../@types/incentivesApi/types'
import IncentiveLevelPayMappingUtil from '../../../../utils/helpers/incentiveLevelPayMappingUtil'
import { datePickerDateToIsoDate, parseDatePickerDate, parseIsoDate } from '../../../../utils/datePickerUtils'
import { formatDate } from '../../../../utils/utils'
import Validator from '../../../../validators/validator'

export class PayDateOption {
  @Expose()
  @Validator(
    startDate =>
      startDate === undefined || startDate === '' || parseDatePickerDate(startDate) < addDays(startOfToday(), 30),
    {
      message: 'Enter a date no later than 30 days into the future',
    },
  )
  startDate: string
}

export default class PayDateOptionRoutes {
  private readonly helper: IncentiveLevelPayMappingUtil

  constructor(
    private readonly prisonService: PrisonService,
    private readonly activitiesService: ActivitiesService,
  ) {
    this.helper = new IncentiveLevelPayMappingUtil(prisonService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { payRateType } = req.params
    const { iep, bandId, paymentStartDate, rate } = req.query
    const payBands = await this.activitiesService.getPayBandsForPrison(user)

    const band = payBands.find(p => p.id === +bandId)

    res.render(`pages/activities/create-an-activity/pay-date-option`, {
      rate,
      iep,
      paymentStartDate,
      band,
      payRateType,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { payRateType } = req.params
    const originalBandId = req.query.bandId
    const originalIncentiveLevel = req.query.iep
    const originalPaymentStartDate = req.query.paymentStartDate
    const { preserveHistory } = req.query
    const { rate, incentiveLevel, startDate } = req.body

    const bandId = Number(req.body.bandId)
    // FIXME: handle original and new start date correctly
    let singlePayIndex = -1
    if (
      (originalPaymentStartDate === undefined && startDate === undefined) ||
      parseIsoDate(originalPaymentStartDate as string) > startOfToday()
    ) {
      singlePayIndex = req.session.createJourney.pay.findIndex(
        p =>
          p.prisonPayBand.id === +originalBandId &&
          p.incentiveLevel === originalIncentiveLevel &&
          p.startDate === originalPaymentStartDate,
      )
    }

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
      startDate: startDate !== undefined ? datePickerDateToIsoDate(startDate) : undefined,
    } as ActivityPay

    if (payRateType === 'single') {
      req.session.createJourney.pay.push(newRate)
    } else {
      req.session.createJourney.flat.push(newRate)
    }

    req.session.createJourney.attendanceRequired = true

    if (req.params.mode === 'edit') await this.updatePay(req, res)
    else res.redirect(`../check-pay${preserveHistory ? '?preserveHistory=true' : ''}`)
  }

  updatePay = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { activityId } = req.session.createJourney
    const { payRateType } = req.params
    const { startDate } = req.body
    const bandId = Number(req.body.bandId)

    const activityPay = req.session.createJourney.pay ?? []
    const activityFlatPay = req.session.createJourney.flat ?? []

    const flatRateBandAlias = activityFlatPay.find(p => p.prisonPayBand.id === req.body.bandId)?.prisonPayBand?.alias
    const singlePayBandAlias = activityPay.find(p => p.prisonPayBand.id === bandId)?.prisonPayBand?.alias

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
      startDate: p.startDate,
    }))

    const updatedActivity = {
      paid: true,
      attendanceRequired: true,
      pay: updatedPayRates,
    } as ActivityUpdateRequest
    await this.activitiesService.updateActivity(activityId, updatedActivity, user)

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
      let futurePayRateChangeMessage = ''
      if (startDate != null) {
        futurePayRateChangeMessage = `Your change will take effect from ${formatDate(parseDatePickerDate(startDate))}`
      }
      successMessage = `You've changed ${req.body.incentiveLevel} incentive level: ${singlePayBandAlias}. ${futurePayRateChangeMessage}`
    }

    return res.redirectWithSuccess('../check-pay?preserveHistory=true', 'Activity updated', successMessage)
  }
}
