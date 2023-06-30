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
import startNewJourney from '../../middleware/startNewJourneyMiddleware'

export default function routes(services: Services): Router {
  const router = Router({ mergeParams: true })

  const serviceName = ServiceName.APPOINTMENTS

  router.use(rolloutMiddleware(serviceName, services))

  // Appointments tiles route
  router.use('/', appointmentsHomeRoutes())

  // Search and view appointment routes
  router.use('/search', appointmentSearchRoutes(services))
  router.use('/:appointmentId(\\d+)', appointmentDetailsRoutes(services))
  router.use('/:appointmentId(\\d+)/occurrence/:occurrenceId(\\d+)', appointmentOccurrenceDetailsRoutes(services))
  router.use('/bulk-appointments/:bulkAppointmentId(\\d+)', bulkAppointmentDetailsRoutes(services))

  // Create appointment journey routes
  router.get('/create/start-individual', startNewJourney('/create/'))
  router.get('/create/start-group', startNewJourney('/create/'))
  router.get('/create/start-bulk', startNewJourney('/create/'))
  router.use('/create/:journeyId', appointmentsCreateRoutes(services))

  // Edit appointment journey routes
  const editAppointmentBaseUrl = '/:appointmentId(\\d+)/occurrence/:occurrenceId(\\d+)/edit'
  router.get(`${editAppointmentBaseUrl}/start/cancel`, startNewJourney('/edit/'))
  router.get(`${editAppointmentBaseUrl}/start/:property`, startNewJourney('/edit/'))
  router.get(`${editAppointmentBaseUrl}/start/:prisonNumber/remove`, startNewJourney('/edit/'))
  router.get(`${editAppointmentBaseUrl}/start/prisoners/add`, startNewJourney('/edit/'))
  router.use(`${editAppointmentBaseUrl}/:journeyId`, appointmentsEditRoutes(services))

  return router
}
