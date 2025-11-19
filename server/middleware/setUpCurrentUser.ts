import { jwtDecode } from 'jwt-decode'
import express from 'express'
import createHttpError from 'http-errors'
import { convertToTitleCase } from '../utils/utils'
import logger from '../../logger'
import ActivitiesService from '../services/activitiesService'

export default function setUpCurrentUser(activitiesService: ActivitiesService) {
  const router = express.Router()

  router.use(async (req, res, next) => {
    try {
      const {
        name,
        user_id: userId,
        authorities: roles = [],
      } = jwtDecode(res.locals.user.token) as {
        name?: string
        user_id?: string
        authorities?: string[]
      }

      if (res.locals.user.authSource !== 'nomis') {
        return next(createHttpError.Forbidden())
      }

      res.locals.user = {
        ...res.locals.user,
        userId,
        name,
        displayName: convertToTitleCase(name),
        roles,
        isActivitiesRolledOut: req.session.user?.isActivitiesRolledOut,
        isAppointmentsRolledOut: req.session.user?.isAppointmentsRolledOut,
      }

      if (res.locals.user.activeCaseLoad.caseLoadId !== req.session.user?.activeCaseLoadId) {
        logger.debug(`Refreshed prison rollout plan for ${res.locals.user.username} as caseload switched from ${req.session.user?.activeCaseLoadId} to ${res.locals.user.activeCaseLoad.caseLoadId}`)
        const rolloutPlan = await activitiesService.getPrisonRolloutPlan(res.locals.user.activeCaseLoad.caseLoadId)
        res.locals.user.isActivitiesRolledOut = rolloutPlan.activitiesRolledOut
        res.locals.user.isAppointmentsRolledOut = rolloutPlan.activitiesRolledOut
      }

      if (res.locals.user.authSource === 'nomis') {
        res.locals.user.staffId = parseInt(userId, 10) || undefined
      }

      req.session.user = res.locals.user

      return next()
    } catch (error) {
      logger.error(error, `Failed to populate user details for: ${res.locals.user && res.locals.user.username}`)
      return next(error)
    }
  })

  return router
}
