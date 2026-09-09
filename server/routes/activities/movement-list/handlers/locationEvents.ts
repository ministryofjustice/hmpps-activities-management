import { Request, Response } from 'express'
import { isValid } from 'date-fns'
import _ from 'lodash'
import DateOption from '../../../../enum/dateOption'
import { EventType, MovementListLocation, MovementListPrisonerEvents, YesNo } from '../../../../@types/activities'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { eventClashes, scheduledEventSort } from '../../../../utils/utils'
import { ScheduledEvent } from '../../../../@types/activitiesAPI/types'
import { dateFromDateOption, formatIsoDate } from '../../../../utils/datePickerUtils'
import AlertsFilterService from '../../../../services/alertsFilterService'
import applyCancellationDisplayRule from '../../../../utils/applyCancellationDisplayRule'

export default class LocationEventsRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
    private readonly alertsFilterService: AlertsFilterService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { locationIds, dateOption, date, timeSlot, isOutside } = req.query
    const { movementListJourney } = req.journeyData

    const outsideList = user.externalActivitiesRolledOut && isOutside === 'true'

    const richDate = dateFromDateOption(dateOption as DateOption, date as string)

    if (!richDate || !isValid(richDate) || (!(locationIds as string) && !outsideList)) {
      return res.redirect('choose-details')
    }

    const locationEvent = outsideList
      ? await this.activitiesService.getExternalMovements(user.activeCaseLoadId, richDate, user, timeSlot as string)
      : await this.activitiesService.getInternalLocationEventsByDpsLocationId(
          user.activeCaseLoadId,
          richDate,
          locationIds as string,
          user,
          timeSlot as string,
        )

    if (locationEvent === undefined || locationEvent.events.length === 0) {
      if (outsideList) {
        return res.render('pages/activities/movement-list/location-events', {
          outsideList,
          dateOption,
          date: formatIsoDate(richDate),
          timeSlot,
          location: undefined,
          movementListJourney,
        })
      }

      const dateQuery = dateOption === DateOption.OTHER ? `&date=${formatIsoDate(richDate)}` : ''

      return res.redirect(`locations?dateOption=${dateOption}${dateQuery}&timeSlot=${timeSlot}`)
    }

    const prisonerNumbers = [...new Set(locationEvent.events.map(event => event.prisonerNumber))]

    const [prisoners, otherEvents] = await Promise.all([
      this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user),
      this.activitiesService.getScheduledEventsForPrisoners(richDate, prisonerNumbers, user),
    ])

    const allEvents = [
      ...otherEvents.activities,
      ...otherEvents.appointments,
      ...otherEvents.visits,
      ...otherEvents.adjudications,
      ...otherEvents.courtHearings,
      ...otherEvents.externalTransfers,
    ] as ScheduledEvent[]

    const locationEventsByPrisoner = _.groupBy(locationEvent.events, event => event.prisonerNumber)
    const allEventsByPrisoner = _.groupBy(allEvents, event => event.prisonerNumber)

    const alertOptions = this.alertsFilterService.getAllAlertFilterOptions()

    movementListJourney.alertFilters ??= alertOptions.map(option => option.key)
    movementListJourney.cancelledEventsFilter ??= YesNo.YES

    const selectedAlerts = movementListJourney.alertFilters

    const location = {
      ...locationEvent,
      prisonerEvents: prisoners
        .map(currentPrisoner => {
          const events = scheduledEventSort(locationEventsByPrisoner[currentPrisoner.prisonerNumber] ?? [])

          if (events.length === 0) {
            return null
          }

          const clashingEvents = scheduledEventSort(
            (allEventsByPrisoner[currentPrisoner.prisonerNumber] ?? [])
              // Prevent showing clashing activities if the clashing event is already shown as an activity
              .filter(
                clash =>
                  !events
                    .filter(event => event.eventType === EventType.ACTIVITY)
                    .map(event => event.scheduledInstanceId)
                    .filter(id => id !== null)
                    .includes(clash.scheduledInstanceId),
              )
              .filter(
                clash =>
                  !events
                    .filter(event => event.eventType === EventType.APPOINTMENT)
                    .map(event => event.appointmentId)
                    .includes(clash.appointmentId),
              )
              .filter(
                clash =>
                  !events
                    .filter(event => event.eventType === EventType.VISIT)
                    .map(event => event.eventId)
                    .includes(clash.eventId),
              )
              .filter(
                clash =>
                  !events
                    .filter(event => event.eventType === EventType.ADJUDICATION_HEARING)
                    .map(event => event.oicHearingId)
                    .includes(clash.oicHearingId),
              )
              // Exclude any event not considered a clash
              .filter(clash => events.some(event => eventClashes(clash, event)))
              // Exclude cancelled appointments that have expired
              .filter(event => event.eventType !== EventType.APPOINTMENT || applyCancellationDisplayRule(event)),
          )

          const filteredEvents = events.filter(
            event => event.eventType !== EventType.APPOINTMENT || applyCancellationDisplayRule(event),
          )

          const visibleEvents =
            movementListJourney.cancelledEventsFilter === YesNo.NO
              ? filteredEvents.filter(
                  event => !event.cancelled && event.status !== 'Cancelled' && event.status !== 'Paused',
                )
              : filteredEvents

          return {
            ...currentPrisoner,
            alerts: this.alertsFilterService.getFilteredAlerts(selectedAlerts, currentPrisoner.alerts),
            category: this.alertsFilterService.getFilteredCategory(selectedAlerts, currentPrisoner.category),
            events: visibleEvents,
            clashingEvents,
          } as MovementListPrisonerEvents
        })
        .filter(prisonerEvent => prisonerEvent && prisonerEvent.events.length > 0),
    } as MovementListLocation

    return res.render('pages/activities/movement-list/location-events', {
      outsideList,
      dateOption,
      date: formatIsoDate(richDate),
      timeSlot,
      location,
      alertOptions,
      movementListJourney,
    })
  }
}
