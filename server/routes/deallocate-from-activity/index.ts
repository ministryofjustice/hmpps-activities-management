import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import validationMiddleware from '../../middleware/validationMiddleware'
import emptyJourneyHandler from '../../middleware/emptyJourneyHandler'
import DeallocationDateRoutes, { DeallocationDate } from './handlers/deallocationDate'
import DeallocationReasonRoutes, { DeallocationReason } from './handlers/deallocationReason'
import { Services } from '../../services'
import CheckDeallocationRoutes from './handlers/checkDeallocation'
import ConfirmationRoutes from './handlers/confirmation'

export default function Index({ activitiesService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('deallocateJourney', stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const deallocationDateHandler = new DeallocationDateRoutes()
  const deallocationReasonHandler = new DeallocationReasonRoutes(activitiesService)
  const checkDeallocationHandler = new CheckDeallocationRoutes(activitiesService)
  const confirmationHandler = new ConfirmationRoutes()

  get('/date', deallocationDateHandler.GET, true)
  post('/date', deallocationDateHandler.POST, DeallocationDate)
  get('/reason', deallocationReasonHandler.GET, true)
  post('/reason', deallocationReasonHandler.POST, DeallocationReason)
  get('/check-answers', checkDeallocationHandler.GET, true)
  post('/check-answers', checkDeallocationHandler.POST)
  get('/confirmation', confirmationHandler.GET, true)

  return router
}
