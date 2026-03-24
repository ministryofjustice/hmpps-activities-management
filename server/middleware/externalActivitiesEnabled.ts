import { RequestHandler } from 'express'
import logger from '../../logger'

/**
 * Static array of prison IDs (caseloads) where external activities are enabled.
 * TODO: Replace with API call to fetch enabled prisons dynamically
 */
const EXTERNAL_ACTIVITIES_ENABLED_PRISONS = [
  'HVI',
  'TCI',
  'SUI',
  'FDI',
  'KMI',
  'KVI',
  'LYI',
  'UPI',
  'SPI',
  'EHI',
  'HDI',
  'UKI',
  'GNI',
  'ESI',
  'LNI',
  'AGI',
  'WNI',
  'WYI',
  // TODO: Local dev only
  // 'RSI',
]

/**
 * Middleware that determines if external activities are enabled for the user's caseload.
 * Compares the user's active caseload against a list of enabled prisons and stores
 * the result as a boolean flag in the session.
 */
function externalActivitiesEnabled(): RequestHandler {
  return async (req, res, next) => {
    try {
      const userCaseLoad = res.locals.user?.activeCaseLoadId

      if (!userCaseLoad) {
        res.locals.isExternalActivitiesEnabled = false
        return next()
      }

      res.locals.isExternalActivitiesEnabled = EXTERNAL_ACTIVITIES_ENABLED_PRISONS.includes(userCaseLoad)

      return next()
    } catch (error) {
      logger.warn('Error determining external activities enabled status, defaulting to false', { error })
      res.locals.isExternalActivitiesEnabled = false
      return next()
    }
  }
}

export default externalActivitiesEnabled
