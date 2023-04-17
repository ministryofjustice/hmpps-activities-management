import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import AppointmentDetailsRoutes from './handlers/appointmentDetails'
import AppointmentMovementSlipRoutes from './handlers/appointmentMovementSlip'

import { Services } from '../../../services'

export default function Index({ activitiesService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const appointmentDetailsHandler = new AppointmentDetailsRoutes()
  const appointmentMovementSlipHandler = new AppointmentMovementSlipRoutes(activitiesService)

  get('/', appointmentDetailsHandler.GET)
  get('/movement-slip', appointmentMovementSlipHandler.GET)

  return router
}
