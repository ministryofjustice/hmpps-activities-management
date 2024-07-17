import { RequestHandler } from 'express'
import createHttpError from 'http-errors'
import logger from '../../logger'
import UserService from '../services/userService'

export default function populateCurrentUser(userService: UserService): RequestHandler {
  return async (req, res, next) => {
    try {
      const { user } = req.session
      req.session.user = await userService.getUser(res.locals.user, user)

      if (req.session.user.authSource !== 'nomis') {
        return next(createHttpError.Forbidden())
      }

      res.locals.user = req.session.user
      return next()
    } catch (error) {
      logger.error(error, `Failed to retrieve user for: ${res.locals.user && res.locals.user.username}`)
      return next(error)
    }
  }
}
