import { Request, Response } from 'express'
import { simpleDateFromDateOption } from '../../../../commonValidationTypes/simpleDate'
import DateOption from '../../../../enum/dateOption'
import { EventType, MovementListLocation, MovementListPrisonerEvents } from '../../../../@types/activities'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { eventClashes, scheduledEventSort } from '../../../../utils/utils'
import { ScheduledEvent } from '../../../../@types/activitiesAPI/types'

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

    const internalLocationEvents = await this.activitiesService.getInternalLocationEvents(
      user.activeCaseLoadId,
      simpleDate.toRichDate(),
      (locationIds as string).split(',').map(id => +id),
      user,
      timeSlot as string,
    )

    if (internalLocationEvents.length === 0) {
      const dateQuery = dateOption === DateOption.OTHER ? `&date=${simpleDate.toIsoString()}` : ''
      return res.redirect(`locations?dateOption=${dateOption}${dateQuery}&timeSlot=${timeSlot}`)
    }

    const prisonerNumbers = [...new Set(internalLocationEvents.flatMap(l => l.events).map(e => e.prisonerNumber))]
    const [prisoners, otherEvents] = await Promise.all([
      this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user),
      this.activitiesService.getScheduledEventsForPrisoners(simpleDate.toRichDate(), prisonerNumbers, user),
    ])

    const allEvents = [
      ...otherEvents.activities,
      ...otherEvents.appointments,
      ...otherEvents.visits,
      ...otherEvents.adjudications,
      ...otherEvents.courtHearings,
      ...otherEvents.externalTransfers,
    ] as ScheduledEvent[]

    const locations = internalLocationEvents.map(
      l =>
        ({
          ...l,
          prisonerEvents: prisoners
            .map(p => {
              const events = scheduledEventSort(l.events.filter(e => e.prisonerNumber === p.prisonerNumber))

              if (events.length === 0) {
                return null
              }

              const clashingEvents = scheduledEventSort(
                allEvents
                  .filter(ce => ce.prisonerNumber === p.prisonerNumber)
                  // Exclude any activities for the prisoner scheduled at the current location
                  .filter(
                    ce =>
                      !events
                        .filter(e => e.eventType === EventType.ACTIVITY)
                        .map(e => e.scheduledInstanceId)
                        .includes(ce.scheduledInstanceId),
                  )
                  // Exclude any appointments for the prisoner scheduled at the current location
                  .filter(
                    ce =>
                      !events
                        .filter(e => e.eventType === EventType.APPOINTMENT)
                        .map(e => e.appointmentId)
                        .includes(ce.appointmentId),
                  )
                  // Exclude any event not considered a clash
                  .filter(ce => events.filter(e => eventClashes(ce, e)).length > 0),
              )

              return {
                ...p,
                alerts: p.alerts.filter(a => this.RELEVANT_ALERT_CODES.includes(a.alertCode)),
                events,
                clashingEvents,
              } as MovementListPrisonerEvents
            })
            .filter(pe => pe),
        } as MovementListLocation),
    )

    return res.render('pages/activities/movement-list/location-events', {
      dateOption,
      date: simpleDate.toIsoString(),
      timeSlot,
      locations,
    })
  }
}
