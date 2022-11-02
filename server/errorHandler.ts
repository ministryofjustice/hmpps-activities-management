import type { NextFunction, Request, Response } from 'express'
import type { HTTPError } from 'superagent'
import logger from '../logger'

export default function createErrorHandler(production: boolean) {
  // next() is not used here but is required for the middleware to be discovered
  return (error: HTTPError, req: Request, res: Response, next: NextFunction): void => {
    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)

    if (error.status === 401 || error.status === 403) {
      logger.info('Logging user out')
      return res.redirect('/sign-out')
    }

    res.status(error.status || 500)

    return res.render('pages/error', {
      message: production ? 'Something went wrong. The error has been logged. Please try again' : error.message,
      status: error.status,
      stack: production ? null : error.stack,
    })
  }
}
