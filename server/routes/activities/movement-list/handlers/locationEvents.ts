import { Request, Response } from 'express'
import { isValid } from 'date-fns'
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
      return res.redirect(`choose-details`)
    }

    const locationEvent = isOutside
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

    const prisoners = await this.prisonService.searchInmatesByPrisonerNumbers(
      [...new Set(locationEvent.events.map(e => e.prisonerNumber))],
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

    movementListJourney.alertFilters ??= alertOptions.map(a => a.key)
    movementListJourney.cancelledEventsFilter ??= YesNo.YES

    const selectedAlerts = movementListJourney.alertFilters

    const location = {
      ...locationEvent,
      prisonerEvents: prisoners
        .map(currentPrisoner => {
          const events = scheduledEventSort(
            locationEvent.events.filter(e => e.prisonerNumber === currentPrisoner.prisonerNumber),
          )

          if (events.length === 0) {
            return null
          }
          const clashingEvents = scheduledEventSort(
            allEvents
              .filter(clash => clash.prisonerNumber === currentPrisoner.prisonerNumber)
              // Prevent showing clashing with activities if the clashing event is already shown as an activity
              .filter(
                clash =>
                  !events
                    .filter(event => event.eventType === EventType.ACTIVITY)
                    .map(e => e.scheduledInstanceId)
                    .filter(id => id !== null)
                    .includes(clash.scheduledInstanceId),
              )
              .filter(
                clash =>
                  !events
                    .filter(e => e.eventType === EventType.APPOINTMENT)
                    .map(e => e.appointmentId)
                    .includes(clash.appointmentId),
              )
              .filter(
                clash =>
                  !events
                    .filter(e => e.eventType === EventType.VISIT)
                    .map(e => e.eventId)
                    .includes(clash.eventId),
              )
              .filter(
                clash =>
                  !events
                    .filter(e => e.eventType === EventType.ADJUDICATION_HEARING)
                    .map(e => e.oicHearingId)
                    .includes(clash.oicHearingId),
              )
              // Exclude any event not considered a clash
              .filter(clash => events.filter(e => eventClashes(clash, e)).length > 0)
              // Exclude cancelled appointments that have expired
              .filter(e => e.eventType !== EventType.APPOINTMENT || applyCancellationDisplayRule(e)),
          )

          const filteredEvents = events.filter(
            e => e.eventType !== EventType.APPOINTMENT || applyCancellationDisplayRule(e),
          )

          const visibleEvents =
            movementListJourney.cancelledEventsFilter === YesNo.NO
              ? filteredEvents.filter(
                  event => !event.cancelled && event.status !== 'Cancelled' && event.status !== 'Paused',
                )
              : filteredEvents

          return {
            ...currentPrisoner,
            alerts: this.alertsFilterService.getFilteredAlerts(selectedAlerts, currentPrisoner?.alerts),
            category: this.alertsFilterService.getFilteredCategory(selectedAlerts, currentPrisoner?.category),
            events: visibleEvents,
            clashingEvents,
          } as MovementListPrisonerEvents
        })
        .filter(pe => pe && pe.events.length > 0),
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
