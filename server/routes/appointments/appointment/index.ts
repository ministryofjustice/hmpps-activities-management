import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import AppointmentDetailsRoutes from './handlers/appointmentDetails'
import AppointmentMovementSlipRoutes from './handlers/appointmentMovementSlip'
import fetchAppointment from '../../../middleware/appointments/fetchAppointment'
import { Services } from '../../../services'

export default function Index({ activitiesService, metricsService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) =>
    router.get(path, fetchAppointment(activitiesService), asyncMiddleware(handler))

  const appointmentDetailsRoutes = new AppointmentDetailsRoutes()
  const appointmentMovementSlipRoutes = new AppointmentMovementSlipRoutes(metricsService)

  get('/', appointmentDetailsRoutes.GET)
  get('/movement-slip', appointmentMovementSlipRoutes.GET)

  return router
}
