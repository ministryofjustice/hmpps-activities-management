import { RequestHandler } from 'express'
import logger from '../../logger'
import UserService from '../services/userService'

export default function populateCurrentUser(userService: UserService): RequestHandler {
  return async (req, res, next) => {
    try {
      if (!req.session.user) {
        const user = res.locals.user && (await userService.getUser(res.locals.user))
        if (user) {
          req.session.user = user
        } else {
          logger.info('No user available')
        }
      }
      res.locals.user = req.session.user
      next()
    } catch (error) {
      logger.error(error, `Failed to retrieve user for: ${res.locals.user && res.locals.user.username}`)
      next(error)
    }
  }
}
