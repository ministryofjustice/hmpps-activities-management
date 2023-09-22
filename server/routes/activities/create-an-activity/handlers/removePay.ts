import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'

export class ConfirmRemoveOptions {
  @Expose()
  @IsIn(['yes', 'no'], { message: 'Select either yes or no' })
  choice: string
}

export default class RemovePayRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { iep } = req.query
    const bandId = +req.query.bandId
    const { preserveHistory } = req.query
    const preserveHistoryString = preserveHistory ? '?preserveHistory=true' : ''

    const pay = req.session.createJourney.pay.findIndex(p => p.bandId === bandId && p.incentiveLevel === iep)
    if (pay < 0) {
      if (req.query && req.query.fromEditActivity) {
        return res.redirect('/activities/schedule/check-pay?preserveHistory=true')
      }
      return res.redirect(`check-pay${preserveHistoryString}`)
    }

    return res.render(`pages/activities/create-an-activity/remove-pay`, { iep, bandId })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { iep, choice } = req.body
    const bandId = +req.body.bandId
    const { preserveHistory } = req.query
    const preserveHistoryString = preserveHistory ? '?preserveHistory=true' : ''

    if (choice !== 'yes') {
      if (req.query && req.query.fromEditActivity) {
        return res.redirect('/activities/schedule/check-pay?preserveHistory=true')
      }
      return res.redirect(`check-pay${preserveHistoryString}`)
    }

    const payIndex = req.session.createJourney.pay.findIndex(p => p.bandId === bandId && p.incentiveLevel === iep)

    // Not found, do nothing and redirect back
    if (payIndex < 0) return res.redirect(`check-pay${preserveHistoryString}`)

    const payInfo = req.session.createJourney.pay[payIndex]
    req.session.createJourney.pay.splice(payIndex, 1)

    if (req.query && req.query.fromEditActivity) {
      return this.updateActivity(req, res)
    }
    return res.redirectWithSuccess(
      `check-pay${preserveHistoryString}`,
      `${payInfo.incentiveLevel} incentive level rate ${payInfo.bandAlias} removed`,
    )
  }

  updateActivity = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { activityId } = req.session.createJourney

    const updatedPayRates = req.session.createJourney.pay.map(p => ({
      incentiveNomisCode: p.incentiveNomisCode,
      incentiveLevel: p.incentiveLevel,
      payBandId: p.bandId,
      rate: p.rate,
    }))

    const incentiveLevels = await this.prisonService.getIncentiveLevels(user.activeCaseLoadId, user)

    const minimumIncentiveLevel =
      incentiveLevels.find(l => req.session.createJourney.pay.find(p => p.incentiveLevel === l.levelName)) ??
      incentiveLevels[0]

    req.session.createJourney.minimumIncentiveNomisCode = minimumIncentiveLevel.levelCode
    req.session.createJourney.minimumIncentiveLevel = minimumIncentiveLevel.levelName

    const updatedActivity = {
      pay: updatedPayRates,
      minimumIncentiveNomisCode: req.session.createJourney.minimumIncentiveNomisCode,
      minimumIncentiveLevel: req.session.createJourney.minimumIncentiveLevel,
    } as ActivityUpdateRequest
    await this.activitiesService.updateActivity(user.activeCaseLoadId, activityId, updatedActivity)
    const successMessage = `We've updated the pay for ${req.session.createJourney.name}`

    return res.redirectWithSuccess(
      '/activities/schedule/check-pay?preserveHistory=true',
      'Activity updated',
      successMessage,
    )
  }
}
