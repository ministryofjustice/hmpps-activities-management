import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import { Services } from '../../../services'
import AdministrationRoutes from './handlers/administration'
import RegimeChangeRoutes, { RegimeTimes } from './handlers/regimeChange'
import validationMiddleware from '../../../middleware/validationMiddleware'
import AppointmentSummaryRoutes, { AppointmentSummary } from './handlers/appointmentSummary'
import AppointmentPreviewRoutes, { AppointmentPreview } from './handlers/appointmentPreview'

export default function Index(services: Services): Router {
  const { activitiesService } = services

  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const adminRouteHandler = new AdministrationRoutes()
  const regimeChangeRouteHandler = new RegimeChangeRoutes(activitiesService)
  const appointmentSummaryRouteHandler = new AppointmentSummaryRoutes(activitiesService)
  const appointmentPreviewRouteHandler = new AppointmentPreviewRoutes(activitiesService)

  get('/admin', adminRouteHandler.GET)
  get('/admin/regime', regimeChangeRouteHandler.GET)
  post('/admin/regime', regimeChangeRouteHandler.POST, RegimeTimes)

  get('/admin/appointment-summary', appointmentSummaryRouteHandler.GET)
  post('/admin/appointment-summary', appointmentSummaryRouteHandler.POST, AppointmentSummary)

  get('/admin/appointment-preview', appointmentPreviewRouteHandler.GET)
  post('/admin/appointment-preview', appointmentPreviewRouteHandler.POST, AppointmentPreview)

  return router
}
