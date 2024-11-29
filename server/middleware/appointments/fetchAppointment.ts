import { RequestHandler } from 'express'
import logger from '../../../logger'
import ActivitiesService from '../../services/activitiesService'
import { compareStrings, formatName } from '../../utils/utils'
import { NameFormatStyle } from '../../utils/helpers/nameFormatStyle'

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
            formatName(a.prisoner.firstName, undefined, a.prisoner.lastName, NameFormatStyle.lastCommaFirst, false),
            formatName(b.prisoner.firstName, undefined, b.prisoner.lastName, NameFormatStyle.lastCommaFirst, false),
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
