import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import AppointmentSeriesDetailsRoutes from './handlers/appointmentSeriesDetails'

import { Services } from '../../../services'
import fetchAppointmentSeries from '../../../middleware/appointments/fetchAppointmentSeries'

export default function Index({ activitiesService, userService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) =>
    router.get(path, fetchAppointmentSeries(activitiesService), asyncMiddleware(handler))

  const appointmentSeriesDetailsRoutes = new AppointmentSeriesDetailsRoutes(userService)

  get('/', appointmentSeriesDetailsRoutes.GET)

  return router
}
