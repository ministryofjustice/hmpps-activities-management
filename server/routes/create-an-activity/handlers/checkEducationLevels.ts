import { Request, Response } from 'express'
import { ActivityUpdateRequest } from '../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../services/activitiesService'

export default class CheckPayRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { educationLevels } = req.session.createJourney

    res.render(`pages/create-an-activity/check-education-level`, { educationLevels })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.query && req.query.fromEditActivity) {
      const { user } = res.locals
      const { activityId } = req.session.createJourney
      const prisonCode = user.activeCaseLoadId
      const activity = {
        minimumEducationLevel: req.session.createJourney.educationLevels,
      } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(prisonCode, activityId, activity)
      const successMessage = `We've updated the education levels for ${req.session.createJourney.name}`

      const returnTo = `/schedule/activities/${req.session.createJourney.activityId}`
      req.session.returnTo = returnTo
      return res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
    }
    return res.redirectOrReturn(`start-date`)
  }
}
