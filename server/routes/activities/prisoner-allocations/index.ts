import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import { Services } from '../../../services'
import validationMiddleware from '../../../middleware/validationMiddleware'
import PrisonerAllocationsHandler from './handlers/prisonerAllocations'

export default function Index({ activitiesService, prisonService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const prisonerAllocationsHandler = new PrisonerAllocationsHandler(activitiesService, prisonService)

  get('/:prisonerNumber', prisonerAllocationsHandler.GET)
  post('/:prisonerNumber', prisonerAllocationsHandler.POST)

  return router
}
