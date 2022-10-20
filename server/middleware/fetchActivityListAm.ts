import { RequestHandler } from 'express'
import logger from '../../logger'
import ActivitiesService from '../services/activitiesService'
import { InternalLocation } from '../@types/activitiesAPI/types'

const getActivityName = (activityLocations: InternalLocation[], location: string) => {
  if (!activityLocations || !location) return ''

  return (
    activityLocations
      .filter(a => a.id === Number(location))
      .map(a => a.description)
      .find(a => !!a) || null
  )
}

export default (activitiesService: ActivitiesService): RequestHandler => {
  return async (req, res, next) => {
    try {
      const { user } = res.locals
      const { activityLocations } = req.session.data
      const activityName = getActivityName(activityLocations, req.query.locationId as string)

      res.locals.activityScheduleAllocations = await activitiesService.getActivitySchedules(
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
