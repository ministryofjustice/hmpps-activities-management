import { Router } from 'express'
import type { Services } from '../services'
import homeRoutes from './home'
import changeLocationRoutes from './change-location'
import createRoutes from './create-an-activity'
import scheduleRoutes from './manage-schedules'
import allocateRoutes from './allocate-to-activity'
import attendanceRoutes from './record-attendance'
import unlockListRoutes from './unlock-list'
import spikeRoutes from './spikes'
import appointmentsHomeRoutes from './appointments/home'
import appointmentsCreateSingleRoutes from './appointments/create-single'
import appointmentDetailsRoutes from './appointments/details'
import appointmentOccurrenceDetailsRoutes from './appointments/occurrence-details'
import errorMessageMiddleware from '../middleware/errorMessageMiddleware'
import successMessageMiddleware from '../middleware/successMessageMiddleware'
import timeNowMiddleware from '../middleware/timeNowMiddleware'

export default function routes(services: Services): Router {
  const router = Router({ mergeParams: true })
  router.use(errorMessageMiddleware())
  router.use(successMessageMiddleware())
  router.use(timeNowMiddleware())

  router.use('/', homeRoutes())
  router.use('/change-location', changeLocationRoutes(services))
  router.use('/create', createRoutes(services))
  router.use('/allocate', allocateRoutes(services))
  router.use('/schedule', scheduleRoutes(services))
  router.use('/attendance', attendanceRoutes(services))
  router.use('/unlock-list', unlockListRoutes(services))
  // Add more beta build routes here

  // Spikes under here spikes
  router.use('/spikes', spikeRoutes(services))

  // Appointments
  router.use('/appointments', appointmentsHomeRoutes())
  router.use('/appointments/create-single', appointmentsCreateSingleRoutes(services))
  router.use('/appointments', appointmentDetailsRoutes(services))
  router.use('/appointment/occurrence', appointmentOccurrenceDetailsRoutes(services))

  return router
}
