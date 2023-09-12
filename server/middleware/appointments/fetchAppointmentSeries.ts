import { RequestHandler } from 'express'
import logger from '../../../logger'
import ActivitiesService from '../../services/activitiesService'
import { parseDate } from '../../utils/utils'

export default (activitiesService: ActivitiesService): RequestHandler => {
  return async (req, res, next) => {
    const { user } = res.locals
    const { appointment, appointmentSeries } = req
    const appointmentSeriesId = appointment?.appointmentSeries?.id ?? +req.params.appointmentSeriesId
    try {
      if (appointmentSeriesId && !Number.isNaN(appointmentSeriesId) && appointmentSeries?.id !== appointmentSeriesId) {
        req.appointmentSeries = await activitiesService.getAppointmentSeriesDetails(appointmentSeriesId, user)

        const now = new Date()
        req.appointmentSeries.appointments = req.appointmentSeries.appointments.filter(
          a => parseDate(`${a.startDate}T${a.startTime}`, "yyyy-MM-dd'T'HH:mm") >= now,
        )
      }
    } catch (error) {
      logger.error(error, `Failed to fetch appointment, id: ${appointmentSeriesId}`)
      return next(error)
    }
    return next()
  }
}
