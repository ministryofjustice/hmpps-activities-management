import { RequestHandler } from 'express'
import logger from '../../logger'
import PrisonService from '../services/prisonService'

export default (prisonService: PrisonService): RequestHandler => {
  return async (req, res, next) => {
    try {
      const { user } = res.locals
      res.locals.absenceReasons = await prisonService.getAbsenceReasons(user)
    } catch (error) {
      logger.error(error, 'Failed to fetch absence reasons.')
      return next(error)
    }
    return next()
  }
}
