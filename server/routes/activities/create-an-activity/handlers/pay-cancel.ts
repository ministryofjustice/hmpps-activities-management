import { Request, Response } from 'express'
import { IsEnum } from 'class-validator'
import { Expose } from 'class-transformer'
import PrisonService from '../../../../services/prisonService'
import ActivitiesService from '../../../../services/activitiesService'
import IncentiveLevelPayMappingUtil from '../../../../utils/helpers/incentiveLevelPayMappingUtil'
import { YesNo } from '../../../../@types/activities'

export class PayCancel {
  @Expose()
  @IsEnum(YesNo, { message: 'Select yes if you want to cancel the change' })
  cancelOption: YesNo
}

export default class PayCancelRoutes {
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
    const { iep, bandId, paymentStartDate } = req.query
    const payBands = await this.activitiesService.getPayBandsForPrison(user)

    const rate =
      req.session.createJourney?.pay?.find(
        p =>
          p.prisonPayBand.id === +bandId &&
          p.incentiveLevel === iep &&
          (p.startDate === paymentStartDate || p.startDate === undefined),
      )?.rate || req.session.createJourney?.flat?.find(p => p.prisonPayBand.id === +bandId)?.rate

    const band = payBands.find(p => p.id === +bandId)

    res.render(`pages/activities/create-an-activity/pay-cancel`, {
      rate,
      iep,
      paymentStartDate,
      band,
      payRateType,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    // FIXME implement remove the future pay rate
    const { preserveHistory } = req.query
    res.redirect(`../check-pay${preserveHistory ? '?preserveHistory=true' : ''}`)
  }
}

// POST = async (req: Request, res: Response): Promise<void> => {
//   // FIXME implement remove the future pay rate
//   const { preserveHistory } = req.query
//   const {startDate, incentiveLevel, band } = req.body
//   const { activityId } = req.session.createJourney
//   const { user } = res.locals

//   let singlePayIndex = -1
//   if (
//     (startDate === undefined) ||
//     parseIsoDate(startDate as string) > startOfToday()
//   ) {
//     singlePayIndex = req.session.createJourney.pay.findIndex(
//       p =>
//         p.prisonPayBand.id === band.id &&
//         p.incentiveLevel === incentiveLevel &&
//         p.startDate === startDate,
//     )
//   }

//   const activityPay = req.session.createJourney.pay ?? []

//   if (singlePayIndex >= 0) req.session.createJourney.pay.splice(singlePayIndex, 1)

//   const updatedPayRates = activityPay.map(p => ({
//     incentiveNomisCode: p.incentiveNomisCode,
//     incentiveLevel: p.incentiveLevel,
//     payBandId: p.prisonPayBand.id,
//     rate: p.rate,
//     startDate: p.startDate,
//   }))

//   const updatedActivity = {
//     paid: true,
//     attendanceRequired: true,
//     pay: updatedPayRates,
//   } as ActivityUpdateRequest
//   await this.activitiesService.updateActivity(activityId, updatedActivity, user)

//   res.redirect(`../check-pay${preserveHistory ? '?preserveHistory=true' : ''}`)
// }
