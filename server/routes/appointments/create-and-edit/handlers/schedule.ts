import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { YesNo } from '../../../../@types/activities'
import ActivitiesService from '../../../../services/activitiesService'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'

export default class ScheduleRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentJourney } = req.session

    const defaultBackLinkHref =
      req.session.appointmentJourney.repeat === YesNo.YES ? 'repeat-period-and-count' : 'repeat'

    const prisonNumbers = appointmentJourney.prisoners.map(p => p.number)

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

    const prisonerSchedules = appointmentJourney.prisoners.map(prisoner => ({
      prisoner,
      scheduledEvents: scheduledEvents.filter(event => event.prisonerNumber === prisoner.number),
    }))

    res.render('pages/appointments/create-and-edit/schedule', {
      backLinkHref: defaultBackLinkHref,
      prisonerSchedules,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    res.redirect('comment')
  }
}
