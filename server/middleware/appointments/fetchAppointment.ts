import { RequestHandler } from 'express'
import logger from '../../../logger'
import ActivitiesService from '../../services/activitiesService'
import { compareStrings, convertToTitleCase, fullName, prisonerName } from '../../utils/utils'
import PrisonService from '../../services/prisonService'
import { PrisonerStatus } from '../../@types/prisonApiImportCustom'

export default (activitiesService: ActivitiesService, prisonService: PrisonService): RequestHandler => {
  return async (req, res, next) => {
    const { user } = res.locals
    const { appointment } = req
    const appointmentId = +req.params.appointmentId
    try {
      if (appointment?.id !== appointmentId) {
        req.appointment = await activitiesService.getAppointmentDetails(appointmentId, user)

        const activePrisoners = (
          await prisonService.searchInmatesByPrisonerNumbers(
            req.appointment.attendees.map(a => a.prisoner.prisonerNumber),
            user,
          )
        )
          .filter(p => p.prisonId === user.activeCaseLoadId && p.status !== PrisonerStatus.INACTIVE_OUT)
          .map(prisoner => prisoner.prisonerNumber)

        req.appointment.attendees = req.appointment.attendees
          // We only want to include active prisoners in the appointment attendees
          .filter(a => activePrisoners.includes(a.prisoner.prisonerNumber))
          .sort((a, b) =>
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
