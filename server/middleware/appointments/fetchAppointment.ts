import { RequestHandler } from 'express'
import logger from '../../../logger'
import ActivitiesService from '../../services/activitiesService'

export default (activitiesService: ActivitiesService): RequestHandler => {
  return async (req, res, next) => {
    const { user } = res.locals
    const { appointment } = req
    const appointmentId = +req.params.appointmentId
    try {
      if (appointment?.id !== appointmentId) {
        req.appointment = await activitiesService.getAppointmentDetails(appointmentId, user)
      }
    } catch (error) {
      logger.error(error, `Failed to fetch appointment, id: ${appointmentId}`)
      return next(error)
    }
    return next()
  }
}
