import { Request, Response } from 'express'
import ActivitiesService from '../../../services/activitiesService'
import { ActivityUpdateRequest } from '../../../@types/activitiesAPI/types'

export default class ConfirmCapacityRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/manage-schedules/confirm-capacity')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { activityId } = req.session.createJourney
    const prisonCode = user.activeCaseLoadId
    const activity = {
      capacity: req.session.createJourney.capacity,
    } as ActivityUpdateRequest
    await this.activitiesService.updateActivity(prisonCode, activityId, activity)
    const successMessage = `We've updated the capacity for ${req.session.createJourney.name}`

    res.redirectOrReturnWithSuccess(
      `/schedule/activities/${req.session.createJourney.activityId}`,
      'Activity updated',
      successMessage,
    )
  }
}
