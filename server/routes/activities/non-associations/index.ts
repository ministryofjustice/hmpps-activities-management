import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import { Services } from '../../../services'
import NonAssociationsRoutes from './handlers/nonAssociations'

export default function Index({ prisonService, activitiesService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const nonAssociationsHandler = new NonAssociationsRoutes(prisonService, activitiesService)

  get('/:activityId/:prisonerNumber', nonAssociationsHandler.GET)

  return router
}
