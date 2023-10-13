import { RequestHandler } from 'express'
import logger from '../../../logger'
import ActivitiesService from '../../services/activitiesService'
import { compareStrings, convertToTitleCase, fullName, prisonerName } from '../../utils/utils'

export default (activitiesService: ActivitiesService): RequestHandler => {
  return async (req, res, next) => {
    const { user } = res.locals
    const { appointment } = req
    const appointmentId = +req.params.appointmentId
    try {
      if (appointment?.id !== appointmentId) {
        req.appointment = await activitiesService.getAppointmentDetails(appointmentId, user)
        req.appointment.attendees = req.appointment.attendees.sort((a, b) =>
          compareStrings(
            prisonerName(convertToTitleCase(fullName(a.prisoner)), false),
            prisonerName(convertToTitleCase(fullName(b.prisoner)), false),
          ),
        )
      }
    } catch (error) {
      logger.error(error, `Failed to fetch appointment, id: ${appointmentId}`)
      return next(error)
    }
    return next()
  }
}
