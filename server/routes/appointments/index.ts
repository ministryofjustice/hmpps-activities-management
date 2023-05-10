import { Router } from 'express'
import fetchAppointmentOccurrence from '../../middleware/appointments/fetchAppointmentOccurrence'
import fetchAppointment from '../../middleware/appointments/fetchAppointment'
import appointmentsHomeRoutes from './home'
import appointmentsCreateRoutes from './create-and-edit/createRoutes'
import appointmentsEditRoutes from './create-and-edit/editRoutes'
import appointmentDetailsRoutes from './details'
import appointmentOccurrenceDetailsRoutes from './occurrence-details'
import appointmentSearchRoutes from './search'
import { Services } from '../../services'

export default function routes(services: Services): Router {
  const router = Router({ mergeParams: true })

  router.use('/', appointmentsHomeRoutes())
  router.use('/create', appointmentsCreateRoutes(services))
  router.use('/search', appointmentSearchRoutes(services))

  router.use('/:appointmentId(\\d+)', appointmentDetailsRoutes(services))

  router.use('/:appointmentId(\\d+)/occurrence/:occurrenceId(\\d+)', appointmentOccurrenceDetailsRoutes(services))
  router.use('/:appointmentId(\\d+)/occurrence/:occurrenceId(\\d+)/edit', appointmentsEditRoutes(services))

  return router
}
