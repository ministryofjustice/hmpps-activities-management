import { RequestHandler, Router } from 'express'
import AppointmentDetailsRoutes from './handlers/appointmentDetails'
import AppointmentMovementSlipRoutes from './handlers/appointmentMovementSlip'
import fetchAppointment from '../../../middleware/appointments/fetchAppointment'
import { Services } from '../../../services'

export default function Index({
  activitiesService,
  userService,
  metricsService,
  bookAVideoLinkService,
  locationMappingService,
}: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, fetchAppointment(activitiesService), handler)

  const appointmentDetailsRoutes = new AppointmentDetailsRoutes(
    userService,
    bookAVideoLinkService,
    locationMappingService,
  )
  const appointmentMovementSlipRoutes = new AppointmentMovementSlipRoutes(metricsService)

  get('/', appointmentDetailsRoutes.GET)
  get('/movement-slip', appointmentMovementSlipRoutes.GET)
  get('/copy', appointmentDetailsRoutes.COPY)

  return router
}
