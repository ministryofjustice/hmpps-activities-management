import { Request, Response } from 'express'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'

export default class CheckEducationLevelHandler {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { educationLevels } = req.session.createJourney

    res.render(`pages/activities/create-an-activity/check-education-level`, { educationLevels })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.routeContext.mode === 'edit') {
      const { user } = res.locals
      const { activityId } = req.session.createJourney
      const activity = {
        minimumEducationLevel: req.session.createJourney.educationLevels,
      } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(activityId, activity, user)
      const successMessage = `You've updated the education levels for ${req.session.createJourney.name}`

      const returnTo = `/activities/view/${req.session.createJourney.activityId}`
      req.session.returnTo = returnTo
      return res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
    }
    return res.redirectOrReturn(`start-date`)
  }
}
