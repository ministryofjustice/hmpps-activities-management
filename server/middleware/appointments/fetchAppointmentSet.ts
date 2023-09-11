import { RequestHandler } from 'express'
import logger from '../../../logger'
import ActivitiesService from '../../services/activitiesService'

export default (activitiesService: ActivitiesService): RequestHandler => {
  return async (req, res, next) => {
    const { user } = res.locals
    const { appointmentSet } = req
    const appointmentSetId = +req.params.appointmentSetId
    try {
      if (appointmentSet?.id !== appointmentSetId) {
        req.appointmentSet = await activitiesService.getAppointmentSetDetails(appointmentSetId, user)
      }
    } catch (error) {
      logger.error(error, `Failed to fetch bulk appointment, id: ${appointmentSetId}`)
      return next(error)
    }
    return next()
  }
}
