import { RequestHandler } from 'express'
import logger from '../../logger'
import PrisonService from '../services/prisonService'
import { Location } from '../@types/prisonApiImport/types'

const getActivityName = (activityLocations: Location[], location: string) => {
  if (!activityLocations || !location) return ''

  return (
    activityLocations
      .filter(a => a.locationId === Number(location))
      .map(a => a.userDescription)
      .find(a => !!a) || null
  )
}

export default (prisonService: PrisonService): RequestHandler => {
  return async (req, res, next) => {
    try {
      const { user } = res.locals
      const { activityLocations } = req.session.data
      const activityName = getActivityName(activityLocations, req.query.locationId as string)

      res.locals.activityList = await prisonService.searchActivities(
        user.activeCaseLoad.caseLoadId,
        req.query.locationId as string,
        req.query.date as string,
        req.query.period as string,
        user,
      )
      res.locals.activityName = activityName
    } catch (error) {
      logger.error(
        error,
        `Failed to fetch activity list, prisonId: ${req.query.prisonId}, locationId: ${req.query.locationId}, date: ${req.query.date}, period: ${req.query.period}`,
      )
      return next(error)
    }
    return next()
  }
}
