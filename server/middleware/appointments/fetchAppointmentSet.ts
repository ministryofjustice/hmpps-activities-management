import { RequestHandler } from 'express'
import logger from '../../../logger'
import ActivitiesService from '../../services/activitiesService'

export default (activitiesService: ActivitiesService): RequestHandler => {
  return async (req, res, next) => {
    const { user } = res.locals
    const { appointment, appointmentSet } = req
    const appointmentSetId = appointment?.appointmentSet?.id ?? +req.params.appointmentSetId
    try {
      if (appointmentSetId && !Number.isNaN(appointmentSetId) && appointmentSet?.id !== appointmentSetId) {
        req.appointmentSet = await activitiesService.getAppointmentSetDetails(appointmentSetId, user)
      }
    } catch (error) {
      logger.error(error, `Failed to fetch appointment set, id: ${appointmentSetId}`)
      return next(error)
    }
    return next()
  }
}
