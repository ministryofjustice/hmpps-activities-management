import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import validationMiddleware from '../../middleware/validationMiddleware'
import emptyJourneyHandler from '../../middleware/emptyJourneyHandler'
import DeallocationDateRoutes, { DeallocationDate } from './handlers/deallocationDate'

export default function Index(): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('deallocateJourney', stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const deallocationDateHandler = new DeallocationDateRoutes()

  get('/', deallocationDateHandler.GET, true)
  post('/', deallocationDateHandler.POST, DeallocationDate)

  return router
}
