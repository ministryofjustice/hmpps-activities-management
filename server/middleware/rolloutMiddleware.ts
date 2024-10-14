import { RequestHandler } from 'express'
import { Services } from '../services'
import ServiceName from '../enum/serviceName'
import asyncMiddleware from './asyncMiddleware'

function rolloutMiddleware(serviceName: ServiceName, { activitiesService }: Services): RequestHandler {
  return asyncMiddleware(async (req, res, next) => {
    const { user } = res.locals
    if (
      (serviceName === ServiceName.ACTIVITIES && !user.isActivitiesRolledOut) ||
      (serviceName === ServiceName.APPOINTMENTS && !user.isAppointmentsRolledOut)
    ) {
      const rolloutPlan = await activitiesService.getPrisonRolloutPlan(user.activeCaseLoadId)
      return res.render('pages/not-rolled-out', {
        serviceName,
        rolloutDate:
          serviceName === ServiceName.ACTIVITIES
            ? rolloutPlan.activitiesRolloutDate
            : rolloutPlan.appointmentsRolloutDate,
      })
    }
    return next()
  })
}

export default rolloutMiddleware
