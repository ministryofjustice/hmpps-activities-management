import { RequestHandler } from 'express'
import { Services } from '../services'

function rolloutMiddleware({ activitiesService }: Services): RequestHandler {
  return async (req, res, next) => {
    const { user } = res.locals
    if (!user.isActivitiesRolledOut) {
      const rolloutPlan = await activitiesService.getPrisonRolloutPlan(user.activeCaseLoadId)
      return res.render('pages/not-rolled-out', { rolloutPlan })
    }
    return next()
  }
}

export default rolloutMiddleware
