import { subDays, subMonths, subWeeks } from 'date-fns'
import { SubLocationCellPattern, UnlockListItem } from '../@types/activities'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import ActivitiesApiClient from '../data/activitiesApiClient'
import { ServiceUser } from '../@types/express'
import { scheduledEventSort, toDate, toDateString } from '../utils/utils'
import AlertsFilterService from './alertsFilterService'
import { ScheduledEvent } from '../@types/activitiesAPI/types'
import { AppointmentFrequency } from '../@types/appointments'

export function applyCancellationDispalyRule(app: ScheduledEvent): boolean {
  let showAppointment = true
  const beginingOfToday = new Date().setHours(0, 0, 0, 0)
  if (app.cancelled) {
    if (
      app.appointmentSeriesFrequency === AppointmentFrequency.DAILY &&
      toDate(app.appointmentSeriesCancellationStartDate) < subDays(beginingOfToday, 2)
    ) {
      showAppointment = false
    } else if (
      app.appointmentSeriesFrequency === AppointmentFrequency.WEEKDAY &&
      toDate(app.appointmentSeriesCancellationStartDate) < subDays(beginingOfToday, 4)
    ) {
      showAppointment = false
    } else if (
      app.appointmentSeriesFrequency === AppointmentFrequency.WEEKLY &&
      toDate(app.appointmentSeriesCancellationStartDate) < subWeeks(beginingOfToday, 2)
    ) {
      showAppointment = false
    } else if (
      app.appointmentSeriesFrequency === AppointmentFrequency.FORTNIGHTLY &&
      toDate(app.appointmentSeriesCancellationStartDate) < subWeeks(beginingOfToday, 4)
    ) {
      showAppointment = false
    } else if (
      app.appointmentSeriesFrequency === AppointmentFrequency.MONTHLY &&
      toDate(app.appointmentSeriesCancellationStartDate) < subMonths(beginingOfToday, 2)
    ) {
      showAppointment = false
    }
  }
  return showAppointment
}

export default class UnlockListService {
  constructor(
    private readonly prisonerSearchApiClient: PrisonerSearchApiClient,
    private readonly activitiesApiClient: ActivitiesApiClient,
    private readonly alertsFilterService: AlertsFilterService,
  ) {}

  async getFilteredUnlockList(
    date: Date,
    timeSlot: string,
    location: string,
    subLocationFilters: string[],
    activityFilter: string,
    stayingOrLeavingFilter: string,
    alertFilters: string[],
    searchTerm: string,
    user: ServiceUser,
  ): Promise<UnlockListItem[]> {
    const prison = user.activeCaseLoadId

    // Get the cell-matching regexp for each sub-location of the main location e.g [A-Wing, B-Wing C-Wing]
    const subLocationCellPatterns = await Promise.all(
      subLocationFilters.map(async sub => {
        const locGroup = `${location}_${sub}`
        const prefix = await this.activitiesApiClient.getPrisonLocationPrefixByGroup(prison, locGroup, user)
        return { subLocation: sub, locationPrefix: prefix.locationPrefix } as SubLocationCellPattern
      }),
    )

    const { locationPrefix } = await this.activitiesApiClient.getPrisonLocationPrefixByGroup(prison, location, user)

    // Get all prisoners located in the main location by cell prefix e.g. MDI-1-.+
    const results = await this.prisonerSearchApiClient.searchPrisonersByLocationPrefix(
      prison,
      locationPrefix.replaceAll('.', '').replaceAll('+', ''),
      0,
      1024,
      user,
    )

    // Give up here if no prisoners are in the locations selected
    if (!results || results.totalElements === 0) {
      return []
    }

    // Create unlock list items for each prisoner returned and populate their sub-location by cell-matching
    const prisoners = results?.content?.map(prisoner => {
      return {
        prisonerNumber: prisoner.prisonerNumber,
        bookingId: prisoner?.bookingId,
        prisonerName: `${prisoner.firstName} ${prisoner.lastName}`,
        cellLocation: prisoner?.cellLocation,
        category: this.alertsFilterService.getFilteredCategory(alertFilters, prisoner?.category),
        incentiveLevel: prisoner?.currentIncentive,
        alerts: this.alertsFilterService.getFilteredAlerts(alertFilters, prisoner?.alerts),
        status: prisoner?.inOutStatus,
        prisonCode: prisoner?.prisonId,
        locationGroup: location,
        locationSubGroup: this.getSubLocationFromCell(prison, subLocationCellPatterns, prisoner?.cellLocation),
      } as unknown as UnlockListItem
    })

    const filteredPrisoners = prisoners.filter(
      prisoner => subLocationFilters.includes(prisoner.locationSubGroup) || subLocationFilters.length === 0,
    )

    const scheduledEvents = await this.activitiesApiClient.getScheduledEventsByPrisonerNumbers(
      prison,
      toDateString(date),
      filteredPrisoners.map(p => p.prisonerNumber),
      user,
      timeSlot,
    )

    // Match the prisoners with their events by prisonerNumber
    const unlockListItems = filteredPrisoners.map(prisoner => {
      const appointments = scheduledEvents?.appointments
        .filter(app => app.prisonerNumber === prisoner.prisonerNumber)
        .filter(app => applyCancellationDispalyRule(app))
      const courtHearings = scheduledEvents?.courtHearings.filter(crt => crt.prisonerNumber === prisoner.prisonerNumber)
      const visits = scheduledEvents?.visits.filter(vis => vis.prisonerNumber === prisoner.prisonerNumber)
      const adjudications = scheduledEvents?.adjudications.filter(adj => adj.prisonerNumber === prisoner.prisonerNumber)
      const transfers = scheduledEvents?.externalTransfers.filter(tra => tra.prisonerNumber === prisoner.prisonerNumber)
      const activities = scheduledEvents?.activities.filter(act => act.prisonerNumber === prisoner.prisonerNumber)
      const allEventsForPrisoner = [
        ...appointments,
        ...courtHearings,
        ...visits,
        ...adjudications,
        ...transfers,
        ...activities,
      ]

      return {
        ...prisoner,
        isLeavingWing: this.isLeaving(allEventsForPrisoner),
        events: scheduledEventSort(allEventsForPrisoner),
      } as UnlockListItem
    })

    const searchTermLowerCase = searchTerm?.toLowerCase()

    return unlockListItems
      .filter(
        i =>
          activityFilter === 'Both' ||
          (activityFilter === 'With' && i.events.length > 0) ||
          (activityFilter === 'Without' && i.events.length === 0),
      )
      .filter(
        i =>
          stayingOrLeavingFilter === 'Both' ||
          (stayingOrLeavingFilter === 'Leaving' && i.isLeavingWing) ||
          (stayingOrLeavingFilter === 'Staying' && !i.isLeavingWing),
      )
      .filter(
        i =>
          !searchTermLowerCase ||
          i.prisonerName?.toLowerCase().includes(searchTermLowerCase) ||
          i.prisonerNumber?.toLowerCase().includes(searchTermLowerCase) ||
          i.events?.find(e => e.summary?.toLowerCase().includes(searchTermLowerCase)),
      )
  }

  private isLeaving = (events: UnlockListItem['events']): boolean => {
    if (events.length === 0) {
      return false
    }

    // TODO: Check rules - event types which are always off-wing?
    const leavingEventTypes = ['COURT_HEARING', 'EXTERNAL_TRANSFER', 'ADJUDICATION_HEARING', 'VISIT']
    const eventsOffWing = events.filter(ev => leavingEventTypes.includes(ev.eventType))
    if (eventsOffWing.length > 0) {
      return true
    }

    // If it's not an off-wing event, check if the event location is off-wing
    const offWingLocations = events.filter(e => !e.inCell && !e.onWing && !e.internalLocationCode?.includes('WOW'))
    return offWingLocations.length > 0
  }

  private getSubLocationFromCell = (
    prison: string,
    cellPatterns: SubLocationCellPattern[],
    cellLocation: string,
  ): string => {
    // eslint-disable-next-line no-restricted-syntax
    for (const cellPattern of cellPatterns) {
      const splitPatterns = cellPattern.locationPrefix.split(',')
      // eslint-disable-next-line no-restricted-syntax
      for (const pattern of splitPatterns) {
        const regex = new RegExp(pattern)
        if (regex.test(`${prison}-${cellLocation}`)) {
          return cellPattern.subLocation
        }
      }
    }
    // Where a location has no sub-locations e.g. Segregation unit, there will be no cell-patterns to match against.
    return ''
  }
}
