import { Request, Response } from 'express'
import { addDays, startOfToday } from 'date-fns'
import { Expose } from 'class-transformer'
import { IsIn, IsNotEmpty, ValidateIf, ValidationArguments } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import ActivitiesService from '../../../../services/activitiesService'
import { Activity, ActivityPay, ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import { IncentiveLevel } from '../../../../@types/incentivesApi/types'
import IncentiveLevelPayMappingUtil from '../../../../utils/helpers/incentiveLevelPayMappingUtil'
import {
  datePickerDateToIsoDate,
  formatIsoDate,
  parseDatePickerDate,
  parseIsoDate,
} from '../../../../utils/datePickerUtils'
import { formatDate } from '../../../../utils/utils'
import Validator from '../../../../validators/validator'
import DateOption from '../../../../enum/dateOption'

const getIEPLevel = (args: ValidationArguments) => (args.object as PayDateOption)?.incentiveLevel
const getBandAlias = (args: ValidationArguments) => (args.object as PayDateOption)?.bandAlias

export class PayDateOption {
  incentiveLevel: string

  bandAlias: string

  @Expose()
  @IsIn(Object.values(DateOption), {
    message: args => {
      return `Select when the change to ${getIEPLevel(args)}: ${getBandAlias(args)} takes effect`
    },
  })
  dateOption: string

  @Validator(startDate => parseDatePickerDate(startDate) > startOfToday(), {
    message: 'The change the date takes effect must be in the future',
  })
  @Validator(startDate => parseDatePickerDate(startDate) < addDays(startOfToday(), 30), {
    message: () => {
      const thirtyDaysInFuture = formatDate(addDays(startOfToday(), 30))
      return `The date that takes effect must be between tomorrow and ${thirtyDaysInFuture}`
    },
  })
  @ValidateIf(o => o.dateOption === 'other')
  @IsNotEmpty({
    message: 'Enter a valid date',
  })
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
    const originalBandId = req.query.bandId
    const originalIncentiveLevel = req.query.iep
    const originalPaymentStartDate = req.query.paymentStartDate
    const { preserveHistory } = req.query
    const { rate, incentiveLevel, startDate, dateOption } = req.body

    const changeDate =
      dateOption === DateOption.TOMORROW ? formatIsoDate(addDays(new Date(), 1)) : datePickerDateToIsoDate(startDate)

    const bandId = Number(req.body.bandId)

    const activity = await this.activitiesService.getActivity(req.session.createJourney.activityId, res.locals.user)

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

    if (singlePayIndex >= 0) req.session.createJourney.pay.splice(singlePayIndex, 1)

    const [band, allIncentiveLevels]: [(string | number)[], IncentiveLevel[]] = await Promise.all([
      this.activitiesService
        .getPayBandsForPrison(user)
        .then(bands => bands.find(b => b.id === bandId))
        .then(b => [b.alias, b.displaySequence]),
      this.prisonService.getIncentiveLevels(user.activeCaseLoadId, user),
    ])

    const [bandAlias, displaySequence] = band

    // if the activity is started then add a future pay rate, else update the default pay rate.
    if (changeDate > activity.startDate) {
      const newRate = {
        rate: +rate,
        prisonPayBand: { id: bandId, alias: String(bandAlias), displaySequence: +displaySequence },
        incentiveNomisCode: allIncentiveLevels.find(s2 => s2.levelName === incentiveLevel)?.levelCode,
        incentiveLevel,
        startDate: changeDate,
      } as ActivityPay
      req.session.createJourney.pay.push(newRate)
    } else {
      const updatedActivityPay = req.session.createJourney.pay.map(pay => {
        if (pay.prisonPayBand.id === bandId && pay.incentiveLevel === incentiveLevel) {
          return {
            ...pay,
            rate: +rate,
          }
        }
        return pay
      })
      req.session.createJourney.pay = updatedActivityPay
    }

    req.session.createJourney.attendanceRequired = true

    if (req.params.mode === 'edit') {
      await this.updatePay(req, res, activity)
    } else {
      res.redirect(`../check-pay${preserveHistory ? '?preserveHistory=true' : ''}`)
    }
  }

  updatePay = async (req: Request, res: Response, activity: Activity) => {
    const { user } = res.locals
    const { startDate, dateOption } = req.body
    const bandId = Number(req.body.bandId)

    const changeDate =
      dateOption === DateOption.TOMORROW ? formatIsoDate(addDays(new Date(), 1)) : datePickerDateToIsoDate(startDate)

    const activityPay = req.session.createJourney.pay ?? []
    const singlePayBandAlias = activityPay.find(p => p.prisonPayBand.id === bandId)?.prisonPayBand?.alias

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
    await this.activitiesService.updateActivity(activity.id, updatedActivity, user)

    req.session.createJourney.allocations = activity.schedules.flatMap(s =>
      s.allocations.filter(a => a.status !== 'ENDED'),
    )

    const affectedAllocations = await this.helper
      .getPayGroupedByIncentiveLevel(req.session.createJourney.pay, req.session.createJourney.allocations, user)
      .then(pays => pays.find(p => p.incentiveLevel === req.body.incentiveLevel)?.pays)
      .then(pays => pays?.find(p => p.prisonPayBand.id === +req.body.bandId).allocationCount)

    let futurePayRateChangeMessage = ''
    if (changeDate != null) {
      futurePayRateChangeMessage = `Your change will take effect from ${formatDate(parseIsoDate(changeDate))}`
    }

    let successMessage
    if (affectedAllocations > 0) {
      successMessage = `You've changed ${req.body.incentiveLevel} incentive level: ${singlePayBandAlias}. There are ${affectedAllocations} people assigned to this pay rate. ${futurePayRateChangeMessage}`
    } else {
      successMessage = `You've changed ${req.body.incentiveLevel} incentive level: ${singlePayBandAlias}. ${futurePayRateChangeMessage}`
    }

    return res.redirectWithSuccess('../check-pay?preserveHistory=true', 'Activity updated', successMessage)
  }
}
