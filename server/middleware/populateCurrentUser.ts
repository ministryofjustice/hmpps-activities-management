import { RequestHandler } from 'express'
import logger from '../../logger'
import UserService from '../services/userService'
import ActivitiesService from '../services/activitiesService'

export default function populateCurrentUser(
  userService: UserService,
  activitiesService: ActivitiesService,
): RequestHandler {
  return async (req, res, next) => {
    try {
      if (!req.session.user) {
        req.session.user = await activitiesService.populateUserPrisonInfo(await userService.getUser(res.locals.user))
      }
      res.locals.user = req.session.user
      next()
    } catch (error) {
      logger.error(error, `Failed to retrieve user for: ${res.locals.user && res.locals.user.username}`)
      next(error)
    }
  }
}
