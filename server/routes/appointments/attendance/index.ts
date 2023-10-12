import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import SelectDateRoutes, { SelectDate } from './handlers/selectDate'

export default function Index(): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const chooseDetailsRoutes = new SelectDateRoutes()

  get('/select-date', chooseDetailsRoutes.GET)
  post('/select-date', chooseDetailsRoutes.POST, SelectDate)

  return router
}
