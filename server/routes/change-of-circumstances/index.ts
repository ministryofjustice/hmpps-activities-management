import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import ChangeOfCircumstanceRoutes from './handlers/changeOfCircumstanceRoutes'
import validationMiddleware from '../../middleware/validationMiddleware'
import { Services } from '../../services'

export default function Index({ activitiesService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const changeOfCircumstanceHandler = new ChangeOfCircumstanceRoutes(activitiesService)

  get('/view-changes', changeOfCircumstanceHandler.GET)
  post('/view-changes', changeOfCircumstanceHandler.POST)

  return router
}
