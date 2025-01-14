import { RequestHandler } from 'express'
import ServiceName from '../enum/serviceName'
import asyncMiddleware from './asyncMiddleware'

function rolloutMiddleware(serviceName: ServiceName): RequestHandler {
  return asyncMiddleware(async (req, res, next) => {
    const { user } = res.locals
    if (
      (serviceName === ServiceName.ACTIVITIES && !user.isActivitiesRolledOut) ||
      (serviceName === ServiceName.APPOINTMENTS && !user.isAppointmentsRolledOut)
    ) {
      return res.render('pages/not-rolled-out', {
        serviceName,
      })
    }
    return next()
  })
}

export default rolloutMiddleware
