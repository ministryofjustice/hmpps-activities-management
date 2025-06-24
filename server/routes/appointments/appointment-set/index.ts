import { RequestHandler, Router } from 'express'
import AppointmentSetDetailsRoutes from './handlers/appointmentSetDetails'
import AppointmentSetMovementSlipRoutes from './handlers/appointmentSetMovementSlip'

import { Services } from '../../../services'
import fetchAppointmentSet from '../../../middleware/appointments/fetchAppointmentSet'

export default function Index({ activitiesService, userService, metricsService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) =>
    router.get(path, fetchAppointmentSet(activitiesService), handler)

  const appointmentSetDetailsRoutes = new AppointmentSetDetailsRoutes(userService)
  const appointmentSetMovementSlipRoutes = new AppointmentSetMovementSlipRoutes(metricsService)

  get('/', appointmentSetDetailsRoutes.GET)
  get('/movement-slip', appointmentSetMovementSlipRoutes.GET)

  return router
}
