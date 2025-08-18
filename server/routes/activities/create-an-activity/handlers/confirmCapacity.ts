import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'

export default class ConfirmCapacityRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/create-an-activity/confirm-capacity')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { activityId, capacity } = req.journeyData.createJourney
    const activity = { capacity } as ActivityUpdateRequest
    await this.activitiesService.updateActivity(activityId, activity, user)

    res.redirectWithSuccess(
      `/activities/view/${req.journeyData.createJourney.activityId}`,
      'Activity updated',
      `You've updated the capacity for ${req.journeyData.createJourney.name}`,
    )
  }
}
