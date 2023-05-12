import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import OccurrenceDetailsRoutes from './handlers/occurrenceDetails'
import OccurrenceMovementSlipRoutes from './handlers/occurrenceMovementSlip'
import fetchAppointmentOccurrence from '../../../middleware/appointments/fetchAppointmentOccurrence'
import { Services } from '../../../services'

export default function Index({ activitiesService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) =>
    router.get(path, fetchAppointmentOccurrence(activitiesService), asyncMiddleware(handler))

  const occurrenceDetailsHandler = new OccurrenceDetailsRoutes()
  const occurrenceMovementSlipHandler = new OccurrenceMovementSlipRoutes()

  get('/', occurrenceDetailsHandler.GET)
  get('/movement-slip', occurrenceMovementSlipHandler.GET)

  return router
}
