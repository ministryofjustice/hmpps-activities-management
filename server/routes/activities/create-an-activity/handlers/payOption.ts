import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { YesNo } from '../../../../@types/activities'
import PrisonService from '../../../../services/prisonService'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'

export class PayOptionForm {
  @Expose()
  @IsEnum(YesNo, { message: 'Select whether this activity should be paid or unpaid' })
  paid: YesNo
}

export default class PayOption {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> =>
    res.render('pages/activities/create-an-activity/pay-option')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { preserveHistory } = req.query
    const preserveHistoryString = preserveHistory ? '?preserveHistory=true' : ''

    req.session.createJourney.paid = req.body.paid === YesNo.YES

    if (req.body.paid !== YesNo.YES) {
      req.session.createJourney.pay = []
      req.session.createJourney.flat = []

      const minimumIncentiveLevel = await this.prisonService.getMinimumIncentiveLevel(
        user.activeCaseLoadId,
        user,
        [],
        [],
      )
      req.session.createJourney.minimumIncentiveNomisCode = minimumIncentiveLevel.levelCode
      req.session.createJourney.minimumIncentiveLevel = minimumIncentiveLevel.levelName

      if (req.params.mode === 'edit') {
        const { activityId } = req.session.createJourney

        const activity = {
          paid: true,
          minimumIncentiveLevel: req.session.createJourney.minimumIncentiveLevel,
          minimumIncentiveNomisCode: req.session.createJourney.minimumIncentiveNomisCode,
          pay: [],
        } as ActivityUpdateRequest

        await this.activitiesService.updateActivity(user.activeCaseLoadId, activityId, activity)
        const successMessage = `You've updated pay status to unpaid for ${req.session.createJourney.name}`

        const returnTo = `/activities/view/${req.session.createJourney.activityId}`
        req.session.returnTo = returnTo
        return res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
      }

      return res.redirectOrReturn('qualification')
    }

    const { pay, flat } = req.session.createJourney
    if (pay?.length > 0 || flat?.length > 0) return res.redirect(`check-pay${preserveHistoryString}`)
    return res.redirect(`pay-rate-type${preserveHistoryString}`)
  }
}
