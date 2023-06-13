import { RequestHandler } from 'express'
import logger from '../../../logger'
import ActivitiesService from '../../services/activitiesService'

export default (activitiesService: ActivitiesService): RequestHandler => {
  return async (req, res, next) => {
    const { user } = res.locals
    const { appointmentOccurrence } = req
    const bulkAppointmentId = +req.params.bulkAppointmentId
    try {
      if (appointmentOccurrence?.id !== bulkAppointmentId) {
        req.bulkAppointment = await activitiesService.getBulkAppointmentDetails(bulkAppointmentId, user)
      }
    } catch (error) {
      logger.error(error, `Failed to fetch appointment occurrence, id: ${bulkAppointmentId}`)
      return next(error)
    }
    return next()
  }
}
