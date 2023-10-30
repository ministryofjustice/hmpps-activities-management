import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsEnum } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import ActivityTier, { activityTierDescriptions } from '../../../../enum/activityTiers'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'

export class TierForm {
  @Expose()
  @Type(() => Number)
  @IsEnum(ActivityTier, { message: 'Select an activity tier' })
  tier: number
}

export default class TierRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> =>
    res.render(`pages/activities/create-an-activity/tier`, { activityTierDescriptions })

  POST = async (req: Request, res: Response): Promise<void> => {
    const { tier }: TierForm = req.body
    const { preserveHistory } = req.query

    req.session.createJourney.tierId = +tier

    if (ActivityTier.TIER_2 === tier) {
      return res.redirect(`organiser${preserveHistory ? '?preserveHistory=true' : ''}`)
    }
    req.session.createJourney.organiserId = null

    if (req.params.mode === 'edit') {
      const { user } = res.locals
      const { activityId } = req.session.createJourney
      const activity = {
        tierId: req.session.createJourney.tierId,
      } as ActivityUpdateRequest

      await this.activitiesService.updateActivity(user.activeCaseLoadId, activityId, activity)
      const successMessage = `We've updated the tier for ${req.session.createJourney.name}`

      const returnTo = `/activities/view/${req.session.createJourney.activityId}`
      return res.redirectWithSuccess(returnTo, 'Activity updated', successMessage)
    }

    return res.redirectOrReturn('risk-level')
  }
}
