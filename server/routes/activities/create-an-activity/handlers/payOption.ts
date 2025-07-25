import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { YesNo } from '../../../../@types/activities'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'

export class PayOptionForm {
  @Expose()
  @IsEnum(YesNo, { message: 'Select yes if people will be paid for attending this activity' })
  paid: YesNo
}

export default class PayOption {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> =>
    res.render('pages/activities/create-an-activity/pay-option')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { preserveHistory } = req.query
    const preserveHistoryString = preserveHistory ? '?preserveHistory=true' : ''

    req.session.createJourney.paid = req.body.paid === YesNo.YES

    if (req.body.paid === YesNo.NO) {
      req.session.createJourney.pay = []
      req.session.createJourney.payChange = []
      req.session.createJourney.flat = []

      if (req.routeContext.mode === 'edit') {
        const { activityId } = req.session.createJourney

        const activity = {
          paid: req.session.createJourney.paid,
          pay: [],
          payChange: [],
        } as ActivityUpdateRequest

        await this.activitiesService.updateActivity(activityId, activity, user)
        const successMessage = `You've updated pay for ${req.session.createJourney.name}. People will now not be paid for attending.`

        const returnTo = `/activities/view/${req.session.createJourney.activityId}`
        req.session.returnTo = returnTo
        return res.redirectWithSuccess(returnTo, 'Activity updated', successMessage)
      }

      return res.redirectOrReturn('qualification')
    }

    const { pay, flat } = req.session.createJourney
    if (pay?.length > 0 || flat?.length > 0) return res.redirect(`check-pay${preserveHistoryString}`)
    return res.redirect(`pay-rate-type${preserveHistoryString}`)
  }
}
