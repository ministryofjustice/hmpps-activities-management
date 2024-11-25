import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import { Services } from '../../../services'
import AdministrationRoutes from './handlers/administration'
import RegimeChangeRoutes, { RegimeTimes } from './handlers/regimeChange'
import validationMiddleware from '../../../middleware/validationMiddleware'
import AppointmentSummaryRoutes, { AppointmentSummary } from './handlers/appointmentSummary'
import AppointmentPreviewRoutes, { AppointmentPreview } from './handlers/appointmentPreview'
import PrisonPayBandsRoutes from './handlers/prisonPayBands'
import AddPrisonPayBandRoutes, { AddPrisonPayBand } from './handlers/addPrisonPayBand'
import UpdatePrisonPayBandRoutes, { UpdatePrisonPayBand } from './handlers/updatePrisonPayBand'

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
  const prisonPayBandsRouteHandler = new PrisonPayBandsRoutes(activitiesService)
  const updatePrisonPayBandRouteHandler = new UpdatePrisonPayBandRoutes(activitiesService)
  const addPrisonPayBandRouteHandler = new AddPrisonPayBandRoutes(activitiesService)

  get('/admin', adminRouteHandler.GET)
  get('/admin/regime', regimeChangeRouteHandler.GET)
  post('/admin/regime', regimeChangeRouteHandler.POST, RegimeTimes)

  get('/admin/appointment-summary', appointmentSummaryRouteHandler.GET)
  post('/admin/appointment-summary', appointmentSummaryRouteHandler.POST, AppointmentSummary)

  get('/admin/appointment-preview', appointmentPreviewRouteHandler.GET)
  post('/admin/appointment-preview', appointmentPreviewRouteHandler.POST, AppointmentPreview)

  get('/admin/prison-pay-bands', prisonPayBandsRouteHandler.GET)

  get('/admin/update-prison-pay-band/:prisonPayBandId(\\d+)', updatePrisonPayBandRouteHandler.GET)
  post(
    '/admin/update-prison-pay-band/:prisonPayBandId(\\d+)',
    updatePrisonPayBandRouteHandler.POST,
    UpdatePrisonPayBand,
  )

  get('/admin/add-prison-pay-band', addPrisonPayBandRouteHandler.GET)
  post('/admin/add-prison-pay-band', addPrisonPayBandRouteHandler.POST, AddPrisonPayBand)

  return router
}
