import { RequestHandler } from 'express'
import logger from '../../../logger'
import ActivitiesService from '../../services/activitiesService'

export default (activitiesService: ActivitiesService): RequestHandler => {
  return async (req, res, next) => {
    const { user } = res.locals
    const { bulkAppointment } = req
    const bulkAppointmentId = +req.params.bulkAppointmentId
    try {
      if (bulkAppointment?.id !== bulkAppointmentId) {
        req.bulkAppointment = await activitiesService.getBulkAppointmentDetails(bulkAppointmentId, user)
      }
    } catch (error) {
      logger.error(error, `Failed to fetch bulk appointment, id: ${bulkAppointmentId}`)
      return next(error)
    }
    return next()
  }
}
