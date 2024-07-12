import { Request, Response } from 'express'
import { isValid } from 'date-fns'
import DateOption from '../../../../enum/dateOption'
import { EventType, MovementListLocation, MovementListPrisonerEvents } from '../../../../@types/activities'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { eventClashes, scheduledEventSort } from '../../../../utils/utils'
import { ScheduledEvent } from '../../../../@types/activitiesAPI/types'
import { dateFromDateOption, formatIsoDate } from '../../../../utils/datePickerUtils'
import AlertsFilterService from '../../../../services/alertsFilterService'

export default class LocationEventsRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
    private readonly alertsFilterService: AlertsFilterService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { locationIds, dateOption, date, timeSlot } = req.query

    const richDate = dateFromDateOption(dateOption as DateOption, date as string)
    if (!richDate || !isValid(richDate) || !(locationIds as string)) {
      return res.redirect(`choose-details`)
    }

    const internalLocationEvents = await this.activitiesService.getInternalLocationEvents(
      user.activeCaseLoadId,
      richDate,
      (locationIds as string).split(',').map(id => +id),
      user,
      timeSlot as string,
    )

    if (internalLocationEvents.length === 0) {
      const dateQuery = dateOption === DateOption.OTHER ? `&date=${formatIsoDate(richDate)}` : ''
      return res.redirect(`locations?dateOption=${dateOption}${dateQuery}&timeSlot=${timeSlot}`)
    }

    const prisoners = await this.prisonService.searchInmatesByPrisonerNumbers(
      [...new Set(internalLocationEvents.flatMap(l => l.events).map(e => e.prisonerNumber))],
      user,
    )

    const otherEvents = await this.activitiesService.getScheduledEventsForPrisoners(
      richDate,
      prisoners.map(p => p.prisonerNumber),
      user,
    )

    const allEvents = [
      ...otherEvents.activities,
      ...otherEvents.appointments,
      ...otherEvents.visits,
      ...otherEvents.adjudications,
      ...otherEvents.courtHearings,
      ...otherEvents.externalTransfers,
    ] as ScheduledEvent[]

    const alertOptions = this.alertsFilterService.getAllAlertFilterOptions()

    req.session.movementListJourney.alertFilters ??= alertOptions.map(a => a.key)

    const { alertFilters } = req.session.movementListJourney

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
                  // Exclude any visits for the prisoner scheduled at the current location
                  .filter(
                    ce =>
                      !events
                        .filter(e => e.eventType === EventType.VISIT)
                        .map(e => e.eventId)
                        .includes(ce.eventId),
                  )
                  // Exclude any adjudications
                  .filter(
                    ce =>
                      !events
                        .filter(e => e.eventType === EventType.ADJUDICATION_HEARING)
                        .map(e => e.oicHearingId)
                        .includes(ce.oicHearingId),
                  )
                  // Exclude any event not considered a clash
                  .filter(ce => events.filter(e => eventClashes(ce, e)).length > 0),
              )

              return {
                ...p,
                alerts: this.alertsFilterService.getFilteredAlerts(alertFilters, p?.alerts),
                category: this.alertsFilterService.getFilteredCategory(alertFilters, p?.category),
                events,
                clashingEvents,
              } as MovementListPrisonerEvents
            })
            .filter(pe => pe),
        }) as MovementListLocation,
    )

    return res.render('pages/activities/movement-list/location-events', {
      dateOption,
      date: formatIsoDate(richDate),
      timeSlot,
      locations,
      alertOptions,
    })
  }
}
