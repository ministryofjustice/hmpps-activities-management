import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import EventTier, { eventTierDescriptions } from '../../../../enum/eventTiers'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'

export class TierForm {
  @Expose()
  @IsEnum(EventTier, { message: 'Select an activity tier' })
  tier: string
}

export default class TierRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> =>
    res.render(`pages/activities/create-an-activity/tier`, { eventTierDescriptions })

  POST = async (req: Request, res: Response): Promise<void> => {
    const { tier }: TierForm = req.body
    const { preserveHistory } = req.query

    req.journeyData.createJourney.tierCode = tier

    if (EventTier.FOUNDATION !== tier) {
      req.journeyData.createJourney.attendanceRequired = true
    }

    if (EventTier.TIER_2 === tier) {
      return res.redirect(`organiser${preserveHistory ? '?preserveHistory=true' : ''}`)
    }
    req.journeyData.createJourney.organiserCode = null

    if (req.routeContext.mode === 'edit') {
      const { user } = res.locals
      const { activityId } = req.journeyData.createJourney
      const activity = {
        tierCode: req.journeyData.createJourney.tierCode,
        attendanceRequired: req.journeyData.createJourney.attendanceRequired,
      } as ActivityUpdateRequest

      await this.activitiesService.updateActivity(activityId, activity, user)
      const successMessage = `We've updated the tier for ${req.journeyData.createJourney.name}`

      const returnTo = `/activities/view/${req.journeyData.createJourney.activityId}`
      return res.redirectWithSuccess(returnTo, 'Activity updated', successMessage)
    }

    return res.redirectOrReturn('risk-level')
  }
}
