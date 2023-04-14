import { RequestHandler } from 'express'
import logger from '../../../logger'
import ActivitiesService from '../../services/activitiesService'

export default (activitiesService: ActivitiesService): RequestHandler => {
  return async (req, res, next) => {
    const { user } = res.locals
    const { appointmentOccurrence } = req
    const occurrenceId = +req.params.occurrenceId
    try {
      if (appointmentOccurrence?.id !== occurrenceId) {
        req.appointmentOccurrence = await activitiesService.getAppointmentOccurrenceDetails(occurrenceId, user)
      }
    } catch (error) {
      logger.error(error, `Failed to fetch appointment occurrence, id: ${occurrenceId}`)
      return next(error)
    }
    return next()
  }
}
