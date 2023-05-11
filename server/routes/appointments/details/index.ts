import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import AppointmentDetailsRoutes from './handlers/appointmentDetails'
import AppointmentMovementSlipRoutes from './handlers/appointmentMovementSlip'

import { Services } from '../../../services'
import fetchAppointment from '../../../middleware/appointments/fetchAppointment'

export default function Index({ activitiesService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) =>
    router.get(path, fetchAppointment(activitiesService), asyncMiddleware(handler))

  const appointmentDetailsHandler = new AppointmentDetailsRoutes()
  const appointmentMovementSlipHandler = new AppointmentMovementSlipRoutes(activitiesService)

  get('/', appointmentDetailsHandler.GET)
  get('/movement-slip', appointmentMovementSlipHandler.GET)

  return router
}
