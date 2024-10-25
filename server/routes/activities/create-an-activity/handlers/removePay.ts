import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { ActivityPay, ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'

export class ConfirmRemoveOptions {
  @Expose()
  @IsIn(['yes', 'no'], { message: 'Confirm if you want to delete the pay rate or not' })
  choice: string
}

export default class RemovePayRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { iep } = req.query
    const bandId = +req.query.bandId
    const { preserveHistory } = req.query
    const preserveHistoryString = preserveHistory ? '?preserveHistory=true' : ''

    const pay = req.session.createJourney.pay.findIndex(p => p.prisonPayBand.id === bandId && p.incentiveLevel === iep)
    if (pay < 0) {
      return res.redirect(`check-pay${preserveHistoryString}`)
    }

    return res.render(`pages/activities/create-an-activity/remove-pay`, { iep, bandId })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { iep, choice } = req.body
    const bandId = +req.body.bandId
    const { preserveHistory } = req.query
    const preserveHistoryString = preserveHistory ? '?preserveHistory=true' : ''

    // index of default pay rate i.e. no start date
    const payIndex = req.session.createJourney.pay.findIndex(
      p => p.prisonPayBand.id === bandId && p.incentiveLevel === iep && p.startDate == null,
    )

    if (choice !== 'yes' || payIndex < 0) {
      return res.redirect(`check-pay${preserveHistoryString}`)
    }
    const payInfo = req.session.createJourney.pay[payIndex]
    req.session.createJourney.pay.splice(payIndex, 1)

    const otherPays: ActivityPay[] = req.session.createJourney.pay.filter(
      pay =>
        pay.prisonPayBand.id === payInfo.prisonPayBand.id &&
        pay.incentiveLevel === payInfo.incentiveLevel &&
        pay.startDate != null,
    )
    if (otherPays.length > 0) {
      otherPays.forEach(otherPay => {
        const otherPayIndex = req.session.createJourney.pay.findIndex(
          p =>
            p.prisonPayBand.id === otherPay.prisonPayBand.id &&
            p.incentiveLevel === otherPay.incentiveLevel &&
            otherPay.startDate === p.startDate,
        )
        req.session.createJourney.pay.splice(otherPayIndex, 1)
      })
    }

    if (req.params.mode === 'edit') {
      return this.updateActivity(req, res)
    }
    return res.redirectWithSuccess(
      `check-pay${preserveHistoryString}`,
      `${payInfo.incentiveLevel} incentive level rate ${payInfo.prisonPayBand.alias} removed`,
    )
  }

  updateActivity = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { activityId } = req.session.createJourney

    const updatedPayRates = req.session.createJourney.pay.map(p => ({
      incentiveNomisCode: p.incentiveNomisCode,
      incentiveLevel: p.incentiveLevel,
      payBandId: p.prisonPayBand.id,
      rate: p.rate,
    }))

    const updatedActivity = {
      pay: updatedPayRates,
    } as ActivityUpdateRequest
    await this.activitiesService.updateActivity(activityId, updatedActivity, user)

    const successMessage = `You've updated the pay for ${req.session.createJourney.name}`
    return res.redirectWithSuccess('check-pay?preserveHistory=true', 'Activity updated', successMessage)
  }
}
