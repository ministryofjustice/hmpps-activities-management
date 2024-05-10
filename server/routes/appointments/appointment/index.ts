import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import AppointmentDetailsRoutes from './handlers/appointmentDetails'
import AppointmentMovementSlipRoutes from './handlers/appointmentMovementSlip'
import AppointmentAttendanceRoutes, { AppointmentAttendance } from './handlers/appointmentAttendance'
import fetchAppointment from '../../../middleware/appointments/fetchAppointment'
import { Services } from '../../../services'
import validationMiddleware from '../../../middleware/validationMiddleware'
import config from '../../../config'

export default function Index({ activitiesService, userService, metricsService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) =>
    router.get(path, fetchAppointment(activitiesService), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const appointmentDetailsRoutes = new AppointmentDetailsRoutes(userService)
  const appointmentMovementSlipRoutes = new AppointmentMovementSlipRoutes(metricsService)
  const appointmentAttendanceRoutes = new AppointmentAttendanceRoutes(activitiesService, userService)

  get('/', appointmentDetailsRoutes.GET)
  get('/movement-slip', appointmentMovementSlipRoutes.GET)
  get('/attendance', appointmentAttendanceRoutes.GET)
  post('/attend', appointmentAttendanceRoutes.ATTEND, AppointmentAttendance)
  post('/non-attend', appointmentAttendanceRoutes.NON_ATTEND, AppointmentAttendance)

  if (config.copyAppointmentFeatureToggleEnabled) {
    get('/copy', appointmentDetailsRoutes.COPY)
  }

  return router
}
