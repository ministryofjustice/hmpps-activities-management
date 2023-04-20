import { Router } from 'express'
import fetchAppointmentOccurrence from '../../middleware/appointments/fetchAppointmentOccurrence'
import fetchAppointment from '../../middleware/appointments/fetchAppointment'
import appointmentsHomeRoutes from './home'
import appointmentsCreateRoutes from './create-and-edit/createRoutes'
import appointmentsEditRoutes from './create-and-edit/editRoutes'
import appointmentDetailsRoutes from './details'
import appointmentOccurrenceDetailsRoutes from './occurrence-details'
import { Services } from '../../services'

export default function routes(services: Services): Router {
  const router = Router({ mergeParams: true })

  const { activitiesService } = services

  router.use('/', appointmentsHomeRoutes())
  router.use('/create', appointmentsCreateRoutes(services))

  router.use('/:appointmentId(\\d+)', fetchAppointment(activitiesService), appointmentDetailsRoutes(services))

  router.use(
    '/:appointmentId(\\d+)/occurrence/:occurrenceId(\\d+)',
    fetchAppointmentOccurrence(activitiesService),
    appointmentOccurrenceDetailsRoutes(),
  )
  router.use('/:appointmentId(\\d+)/occurrence/:occurrenceId(\\d+)/edit', appointmentsEditRoutes(services))

  return router
}
