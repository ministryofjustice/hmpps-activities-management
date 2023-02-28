import { RequestHandler } from 'express'
import logger from '../../logger'
import ActivitiesService from '../services/activitiesService'

export default (activitiesService: ActivitiesService): RequestHandler => {
  return async (req, res, next) => {
    const { user, activity } = res.locals
    const activityId = +req.params.activityId
    try {
      if (!activity || activity.id !== activityId) {
        res.locals.activity = await activitiesService.getActivity(activityId, user)
      }
    } catch (error) {
      logger.error(error, `Failed to fetch activity, id: ${activityId}`)
      return next(error)
    }
    return next()
  }
}
