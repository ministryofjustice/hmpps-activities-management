import { SubLocationCellPattern, UnlockFilters, UnlockListItem } from '../@types/activities'
import PrisonApiClient from '../data/prisonApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import ActivitiesApiClient from '../data/activitiesApiClient'
import { ServiceUser } from '../@types/express'
import { ScheduledEvent } from '../@types/activitiesAPI/types'
import { convertToTitleCase, toDateString } from '../utils/utils'

export default class UnlockListService {
  constructor(
    private readonly prisonApiClient: PrisonApiClient,
    private readonly prisonerSearchApiClient: PrisonerSearchApiClient,
    private readonly activitiesApiClient: ActivitiesApiClient,
  ) {}

  private RELEVANT_ALERT_CODES = ['HA', 'PEEP', 'XEL', 'XCU']

  async getFilteredUnlockList(unlockFilters: UnlockFilters, user: ServiceUser): Promise<UnlockListItem[]> {
    const prison = user.activeCaseLoadId

    // Get the cell-matching regexp for each sub-location of the main location e.g [A-Wing, B-Wing C-Wing]
    const subLocationCellPatterns = await Promise.all(
      unlockFilters.subLocations.map(async sub => {
        const locGroup = `${unlockFilters.location}_${sub}`
        const prefix = await this.activitiesApiClient.getPrisonLocationPrefixByGroup(prison, locGroup, user)
        return { subLocation: sub, locationPrefix: prefix.locationPrefix } as SubLocationCellPattern
      }),
    )

    // Get all prisoners located in the main location by cell prefix e.g. MDI-1-
    const results = await this.prisonerSearchApiClient.searchPrisonersByLocationPrefix(
      prison,
      unlockFilters.cellPrefix,
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
        locationGroup: unlockFilters.location,
        locationSubGroup: this.getSubLocationFromCell(prison, subLocationCellPatterns, prisoner?.cellLocation),
      } as unknown as UnlockListItem
    })

    // Apply filters for selected sub-locations
    const locationFilters = unlockFilters.locationFilters.filter(loc => loc.checked === true).map(loc => loc.value)
    const filteredPrisoners = prisoners.filter(prisoner => locationFilters.includes(prisoner.locationSubGroup) === true)

    const scheduledEvents = await this.activitiesApiClient.getScheduledEventsByPrisonerNumbers(
      prison,
      toDateString(unlockFilters.unlockDate),
      filteredPrisoners.map(p => p.prisonerNumber),
      user,
      unlockFilters.timeSlot,
    )

    // Match the prisoners with their events by prisonerNumber
    const unlockListItems = filteredPrisoners.map(prisoner => {
      const appointments = scheduledEvents?.appointments.filter(
        app => app.prisonerNumber === prisoner.prisonerNumber && !app.deleted,
      )
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
        displayName: convertToTitleCase(`${prisoner.lastName}, ${prisoner.firstName}`),
        events: this.unlockListSort(allEventsForPrisoner),
      } as UnlockListItem
    })

    // Apply filter for with or without activities
    const selectedActivityFilters = unlockFilters.activityFilters
      .filter(act => act.checked === true)
      .map(act => act.value)

    const activityFilteredItems = selectedActivityFilters.includes('Both')
      ? unlockListItems
      : unlockListItems.filter(item =>
          selectedActivityFilters.includes('With') ? item.events.length > 0 : item.events.length === 0,
        )

    // Apply filter for staying or leaving the wing
    const stayingOrLeavingFilters = unlockFilters.stayingOrLeavingFilters.filter(s => s.checked).map(s => s.value)
    let filteredItems: UnlockListItem[]
    if (stayingOrLeavingFilters.includes('Both')) {
      filteredItems = activityFilteredItems
    } else if (stayingOrLeavingFilters.includes('Leaving')) {
      filteredItems = activityFilteredItems.filter(item => this.isLeaving(item))
    } else {
      filteredItems = activityFilteredItems.filter(item => !this.isLeaving(item))
    }

    return filteredItems
  }

  private isLeaving = (item: UnlockListItem): boolean => {
    if (item.events.length === 0) {
      return false
    }

    // TODO: Check rules - event types which are always off-wing?
    const leavingEventTypes = ['COURT_HEARING', 'EXTERNAL_TRANSFER', 'ADJUDICATION_HEARING', 'VISIT']
    const eventsOffWing = item.events.filter(ev => leavingEventTypes.includes(ev.eventType))
    if (eventsOffWing.length > 0) {
      return true
    }

    // TODO: Check rules for 'ACTIVITY' and 'APPOINTMENT' event types
    // If event is not 'inCell' then location id should be checked to confirm if event is on-wing or off-wing
    // If one or more events are off-wing, then prisoner should appear in off-wing list

    return false
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

  // Events should be sorted by time, then event name (summary)
  private unlockListSort = (data: ScheduledEvent[]): ScheduledEvent[] => {
    return data.sort((p1, p2) => {
      if (p1.startTime < p2.startTime) return -1
      if (p1.startTime > p2.startTime) return 1
      if (p1.summary.toLowerCase() < p2.summary.toLowerCase()) return -1
      if (p1.summary.toLowerCase() > p2.summary.toLowerCase()) return 1
      return 0
    })
  }
}
