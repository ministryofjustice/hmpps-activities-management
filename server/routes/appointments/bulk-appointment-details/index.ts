import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import BulkAppointmentDetailsRoutes from './handlers/bulkAppointmentDetails'
import BulkAppointmentMovementSlipRoutes from './handlers/bulkAppointmentMovementSlip'

import { Services } from '../../../services'
import fetchAppointmentSet from '../../../middleware/appointments/fetchAppointmentSet'

export default function Index({ activitiesService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) =>
    router.get(path, fetchAppointmentSet(activitiesService), asyncMiddleware(handler))

  const bulkAppointmentDetailsHandler = new BulkAppointmentDetailsRoutes()
  const bulkAppointmentMovementSlipHandler = new BulkAppointmentMovementSlipRoutes()

  get('/', bulkAppointmentDetailsHandler.GET)
  get('/movement-slip', bulkAppointmentMovementSlipHandler.GET)

  return router
}
