import { Router } from 'express'
import appointmentsHomeRoutes from './home'
import appointmentsCreateRoutes from './create-and-edit/createRoutes'
import appointmentsEditRoutes from './create-and-edit/editRoutes'
import appointmentDetailsRoutes from './details'
import appointmentOccurrenceDetailsRoutes from './occurrence-details'
import appointmentSearchRoutes from './search'
import bulkAppointmentDetailsRoutes from './bulk-appointment-details'
import { Services } from '../../services'
import rolloutMiddleware from '../../middleware/rolloutMiddleware'
import ServiceName from '../../enum/serviceName'

export default function routes(services: Services): Router {
  const router = Router({ mergeParams: true })

  const serviceName = ServiceName.APPOINTMENTS

  router.use(rolloutMiddleware(serviceName, services))

  router.use('/', appointmentsHomeRoutes())
  router.use('/create', appointmentsCreateRoutes(services))
  router.use('/search', appointmentSearchRoutes(services))

  router.use('/:appointmentId(\\d+)', appointmentDetailsRoutes(services))

  router.use('/:appointmentId(\\d+)/occurrence/:occurrenceId(\\d+)', appointmentOccurrenceDetailsRoutes(services))
  router.use('/:appointmentId(\\d+)/occurrence/:occurrenceId(\\d+)/edit', appointmentsEditRoutes(services))

  router.use('/bulk-appointments/:bulkAppointmentId(\\d+)', bulkAppointmentDetailsRoutes(services))

  return router
}
