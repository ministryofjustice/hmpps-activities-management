import { Request, Response } from 'express'
import { simpleDateFromDateOption } from '../../../../commonValidationTypes/simpleDate'
import DateOption from '../../../../enum/dateOption'
import { EventType, MovementListItem } from '../../../../@types/activities'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { eventClashes } from '../../../../utils/utils'

export default class LocationEventsRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  private RELEVANT_ALERT_CODES = ['HA', 'PEEP', 'XEL', 'XCU']

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { locationIds, dateOption, date, timeSlot } = req.query

    const simpleDate = simpleDateFromDateOption(dateOption as DateOption, date as string)
    if (!simpleDate || !(locationIds as string)) {
      return res.redirect(`choose-details`)
    }

    const locations = await this.activitiesService.getInternalLocationEvents(
      user.activeCaseLoadId,
      simpleDate.toRichDate(),
      (locationIds as string).split(',').map(id => parseInt(id, 10)),
      user,
      timeSlot as string,
    )

    const events = locations.flatMap(l => l.events)
    const prisonerNumbers = [...new Set(events.map(e => e.prisonerNumber))]

    const [prisoners, otherEvents] = await Promise.all([
      this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user),
      this.activitiesService.getScheduledEventsForPrisoners(simpleDate.toRichDate(), prisonerNumbers, user),
    ])

    const allEvents = [
      ...otherEvents.activities,
      ...otherEvents.appointments,
      ...otherEvents.visits,
      ...otherEvents.adjudications,
      // TODO: Should these be shown?
      // ...otherEvents.courtHearings,
      // ...otherEvents.externalTransfers,
    ]

    const locationEvents = prisoners.map(p => {
      const prisonerEvents = events.filter(e => e.prisonerNumber === p.prisonerNumber)

      const prisonerClashingEvents = allEvents
        .filter(e => e.prisonerNumber === p.prisonerNumber)
        // Exclude any activities for the prisoner scheduled at the current location
        .filter(
          e =>
            !prisonerEvents
              .filter(pe => pe.eventType === EventType.ACTIVITY)
              .map(pe => pe.scheduledInstanceId)
              .includes(e.scheduledInstanceId),
        )
        // Exclude any appointments for the prisoner scheduled at the current location
        .filter(
          e =>
            !prisonerEvents
              .filter(pe => pe.eventType === EventType.APPOINTMENT)
              .map(pe => pe.appointmentId)
              .includes(e.appointmentId),
        )
        // Exclude any event not considered a clash
        .filter(e => prisonerEvents.filter(pe => eventClashes(e, pe)).length > 0)

      return {
        ...p,
        alerts: p.alerts.filter(a => this.RELEVANT_ALERT_CODES.includes(a.alertCode)),
        events: prisonerEvents,
        clashingEvents: prisonerClashingEvents,
      } as MovementListItem
    })

    return res.render('pages/activities/movement-list/location-events', {
      dateOption,
      date: simpleDate.toIsoString(),
      timeSlot,
      locations,
      locationEvents,
    })
  }
}
