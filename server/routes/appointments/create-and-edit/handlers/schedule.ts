import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { YesNo } from '../../../../@types/activities'
import ActivitiesService from '../../../../services/activitiesService'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import { AppointmentType } from '../appointmentJourney'

export default class ScheduleRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentJourney, bulkAppointmentJourney } = req.session
    const { preserveHistory } = req.query

    let backLinkHref: string
    if (req.session.appointmentJourney.type === AppointmentType.BULK) {
      backLinkHref = 'review-bulk-appointment'
    } else {
      backLinkHref = req.session.appointmentJourney.repeat === YesNo.YES ? 'repeat-period-and-count' : 'repeat'
    }

    const prisonNumbers =
      appointmentJourney.type === AppointmentType.BULK
        ? bulkAppointmentJourney.appointments.map(a => a.prisoner.number)
        : appointmentJourney.prisoners.map(p => p.number)

    const scheduledEvents = await this.activitiesService
      .getScheduledEventsForPrisoners(
        plainToInstance(SimpleDate, appointmentJourney.startDate).toRichDate(),
        prisonNumbers,
        user,
      )
      .then(response => [
        ...response.activities,
        ...response.appointments,
        ...response.courtHearings,
        ...response.visits,
        ...response.externalTransfers,
        ...response.adjudications,
      ])

    const prisonerSchedules =
      appointmentJourney.type === AppointmentType.BULK
        ? bulkAppointmentJourney.appointments.map(appointment => ({
            prisoner: appointment.prisoner,
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            scheduledEvents: scheduledEvents.filter(event => event.prisonerNumber === appointment.prisoner.number),
          }))
        : appointmentJourney.prisoners.map(prisoner => ({
            prisoner,
            scheduledEvents: scheduledEvents.filter(event => event.prisonerNumber === prisoner.number),
          }))

    res.render('pages/appointments/create-and-edit/schedule', {
      backLinkHref,
      preserveHistory,
      prisonerSchedules,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    res.redirectOrReturn(
      req.session.appointmentJourney.type === AppointmentType.BULK ? 'bulk-appointment-comments' : 'comment',
    )
  }

  REMOVE = async (req: Request, res: Response): Promise<void> => {
    const { prisonNumber } = req.params

    if (req.session.appointmentJourney.type === AppointmentType.BULK) {
      req.session.bulkAppointmentJourney.appointments = req.session.bulkAppointmentJourney.appointments.filter(
        appointment => appointment.prisoner.number !== prisonNumber,
      )
    } else {
      req.session.appointmentJourney.prisoners = req.session.appointmentJourney.prisoners.filter(
        prisoner => prisoner.number !== prisonNumber,
      )
    }

    res.redirect(`../../schedule${req.query.preserveHistory ? '?preserveHistory=true' : ''}`)
  }
}
