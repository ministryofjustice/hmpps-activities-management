import { Request, Response } from 'express'
import { IsEnum } from 'class-validator'
import { Expose } from 'class-transformer'
import { startOfToday } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import { YesNo } from '../../../../@types/activities'
import { parseIsoDate } from '../../../../utils/datePickerUtils'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'

export class PayCancel {
  @Expose()
  @IsEnum(YesNo, { message: 'Select yes if you want to cancel the change' })
  cancelOption: YesNo
}

export default class PayCancelRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

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
    const { user } = res.locals
    const { preserveHistory } = req.query
    const { startDate, incentiveLevel } = req.body
    const { activityId } = req.session.createJourney

    const bandId = Number(req.body.bandId)

    if (req.body.cancelOption === YesNo.YES) {
      let singlePayIndex = -1
      if (startDate === undefined || parseIsoDate(startDate as string) > startOfToday()) {
        singlePayIndex = req.session.createJourney.pay.findIndex(
          p => p.prisonPayBand.id === bandId && p.incentiveLevel === incentiveLevel && p.startDate === startDate,
        )
      }

      const activityPay = req.session.createJourney.pay ?? []

      let payBandAlias
      if (singlePayIndex >= 0) {
        payBandAlias = req.session.createJourney.pay[singlePayIndex].prisonPayBand.alias
        req.session.createJourney.pay.splice(singlePayIndex, 1)
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

      return res.redirectWithSuccess(
        `../check-pay${preserveHistory ? '?preserveHistory=true' : ''}`,
        'Activity updated',
        `You've cancelled the change to the pay amount for ${incentiveLevel}:${payBandAlias}.`,
      )
    }
    return res.redirectOrReturn(`../check-pay${preserveHistory ? '?preserveHistory=true' : ''}`)
  }
}
