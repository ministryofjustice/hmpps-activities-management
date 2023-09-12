import { Router } from 'express'
import appointmentsHomeRoutes from './home'
import appointmentsCreateRoutes from './create-and-edit/createRoutes'
import appointmentsEditRoutes from './create-and-edit/editRoutes'
import appointmentDetailsRoutes from './appointment-series'
import appointmentOccurrenceDetailsRoutes from './occurrence-details'
import appointmentSearchRoutes from './search'
import bulkAppointmentDetailsRoutes from './appointment-set'
import { Services } from '../../services'
import rolloutMiddleware from '../../middleware/rolloutMiddleware'
import ServiceName from '../../enum/serviceName'
import appointmentsStartNewJourney from '../../middleware/appointmentsStartNewJourney'
import addServiceReturnLink from '../../middleware/addServiceReturnLink'

export default function routes(services: Services): Router {
  const router = Router({ mergeParams: true })

  const serviceName = ServiceName.APPOINTMENTS

  router.use(rolloutMiddleware(serviceName, services))
  router.use(/\/.+/, addServiceReturnLink('Go to all appointments tasks', '/appointments'))

  // Appointments tiles route
  router.use('/', appointmentsHomeRoutes())

  // Search and view appointment routes
  router.use('/search', appointmentSearchRoutes(services))
  router.use('/:appointmentId(\\d+)', appointmentDetailsRoutes(services))
  router.use('/:appointmentId(\\d+)/occurrence/:occurrenceId(\\d+)', appointmentOccurrenceDetailsRoutes(services))
  router.use('/bulk-appointments/:bulkAppointmentId(\\d+)', bulkAppointmentDetailsRoutes(services))

  // Create appointment journey routes. These are the starting points for the three appointment type creation journeys.
  // They use the startNewJourney middleware which adds a unique journeyId into the url after the /create/ path segment
  // then redirects to that new url
  router.get('/create/start-individual', appointmentsStartNewJourney('/create/'))
  router.get('/create/start-group', appointmentsStartNewJourney('/create/'))
  router.get('/create/start-bulk', appointmentsStartNewJourney('/create/'))
  router.get('/create/start-prisoner/:prisonNumber', appointmentsStartNewJourney('/create/'))
  // All create routes include the unique journeyId which is used by the populateJourney middleware to associate a
  // distinct mapped session datum with the journey. This prevents journeys in different browser tabs from conflicting
  // with each other. N.B. all subsequent redirects need to be relative or include the journeyId to maintain the per
  // journey session datum
  router.use('/create/:journeyId', appointmentsCreateRoutes(services))

  // Edit appointment journey routes. These are the starting points for all appointment modification journeys.
  // They use the startNewJourney middleware which adds a unique journeyId into the url after the /edit/ path segment
  // then redirects to that new url
  const editAppointmentBaseUrl = '/:appointmentId(\\d+)/occurrence/:occurrenceId(\\d+)/edit'
  router.get(`${editAppointmentBaseUrl}/start/cancel`, appointmentsStartNewJourney('/edit/'))
  router.get(`${editAppointmentBaseUrl}/start/:property`, appointmentsStartNewJourney('/edit/'))
  router.get(`${editAppointmentBaseUrl}/start/:prisonNumber/remove`, appointmentsStartNewJourney('/edit/'))
  router.get(`${editAppointmentBaseUrl}/start/prisoners/add`, appointmentsStartNewJourney('/edit/'))
  // All edit routes include the unique journeyId which is used by the populateJourney middleware to associate a
  // distinct mapped session datum with the journey. This prevents journeys in different browser tabs from conflicting
  // with each other. N.B. all subsequent redirects need to be relative or include the journeyId to maintain the per
  // journey session datum
  router.use(`${editAppointmentBaseUrl}/:journeyId`, appointmentsEditRoutes(services))

  return router
}
