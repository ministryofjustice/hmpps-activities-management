import { SubLocationCellPattern, UnlockListItem } from '../@types/activities'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import ActivitiesApiClient from '../data/activitiesApiClient'
import { ServiceUser } from '../@types/express'
import { scheduledEventSort, toDateString } from '../utils/utils'

export default class UnlockListService {
  constructor(
    private readonly prisonerSearchApiClient: PrisonerSearchApiClient,
    private readonly activitiesApiClient: ActivitiesApiClient,
  ) {}

  private RELEVANT_ALERT_CODES = ['HA', 'PEEP', 'XEL', 'XCU']

  async getFilteredUnlockList(
    date: Date,
    timeSlot: string,
    location: string,
    subLocationFilters: string[],
    activityFilter: string,
    stayingOrLeavingFilter: string,
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
        firstName: prisoner.firstName,
        lastName: prisoner.lastName,
        cellLocation: prisoner?.cellLocation,
        category: prisoner?.category,
        incentiveLevel: prisoner?.currentIncentive,
        alerts: prisoner?.alerts?.filter(a => this.RELEVANT_ALERT_CODES.includes(a.alertCode)),
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
      const appointments = scheduledEvents?.appointments.filter(app => app.prisonerNumber === prisoner.prisonerNumber)
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
