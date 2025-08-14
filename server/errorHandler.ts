import type { NextFunction, Request, Response } from 'express'
import type { HTTPError } from 'superagent'
import { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import logger from '../logger'
import { getErrorStatus } from './utils/helpers/errorHelpers'

interface BadRequest extends HTTPError {
  developerMessage: string
}

export default function createErrorHandler(production: boolean) {
  // next() is not used here but is required for the middleware to be discovered
  return (error: HTTPError | SanitisedError, req: Request, res: Response, next: NextFunction): void => {
    logger.error(
      `Error handling ${req.method} request for '${req.originalUrl}', user '${res.locals.user?.username}'`,
      error,
    )
    const errorStatus = getErrorStatus(error)
    switch (errorStatus) {
      case 400: {
        const badRequest = JSON.parse(error.text) as BadRequest
        return res.validationFailed('', badRequest?.developerMessage)
      }
      case 401:
        logger.info('Logging user out')
        return res.redirect('/sign-out')
      case 403:
        return res.render('pages/403')
      case 404:
        res.status(404)
        return res.render('pages/404')
      default: {
        // If error status not matched default to a 500 error and show a generic error page
        const status = errorStatus || 500
        res.status(status)

        return res.render('pages/error', {
          message: production ? 'Sorry, there is a problem with the service' : error.message,
          status,
          stack: production ? null : error.stack,
        })
      }
    }
  }
}
