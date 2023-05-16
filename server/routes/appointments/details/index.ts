import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import AppointmentDetailsRoutes from './handlers/appointmentDetails'

import { Services } from '../../../services'
import fetchAppointment from '../../../middleware/appointments/fetchAppointment'

export default function Index({ activitiesService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) =>
    router.get(path, fetchAppointment(activitiesService), asyncMiddleware(handler))

  const appointmentDetailsHandler = new AppointmentDetailsRoutes()

  get('/', appointmentDetailsHandler.GET)

  return router
}
