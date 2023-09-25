import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import AppointmentSetDetailsRoutes from './handlers/appointmentSetDetails'
import AppointmentSetMovementSlipRoutes from './handlers/appointmentSetMovementSlip'

import { Services } from '../../../services'
import fetchAppointmentSet from '../../../middleware/appointments/fetchAppointmentSet'

export default function Index({ activitiesService, metricsService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) =>
    router.get(path, fetchAppointmentSet(activitiesService), asyncMiddleware(handler))

  const appointmentSetDetailsRoutes = new AppointmentSetDetailsRoutes()
  const appointmentSetMovementSlipRoutes = new AppointmentSetMovementSlipRoutes(metricsService)

  get('/', appointmentSetDetailsRoutes.GET)
  get('/movement-slip', appointmentSetMovementSlipRoutes.GET)

  return router
}
