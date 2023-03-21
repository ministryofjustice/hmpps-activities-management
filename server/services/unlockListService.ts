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

    // Get the scheduled events from their master source for these prisoners (activities, court, visits, appointments)
    const scheduledEvents = await this.activitiesApiClient.getScheduledEventsByPrisonerNumbers(
      prison,
      toDateString(unlockFilters.unlockDate),
      filteredPrisoners.map(p => p.prisonerNumber),
      user,
      unlockFilters.timeSlot,
    )

    // TODO: Adjudication hearings (Check with Adjudications team for rolled-out prisons and API options)
    // TODO: Transfers - already have endpoint in prisonAPI for these

    // Match the prisoners with their events by prisonerNumber
    const unlockListItems = filteredPrisoners.map(prisoner => {
      const appointments = scheduledEvents?.appointments.filter(app => app.prisonerNumber === prisoner.prisonerNumber)
      const courtHearings = scheduledEvents?.courtHearings.filter(crt => crt.prisonerNumber === prisoner.prisonerNumber)
      const visits = scheduledEvents?.visits.filter(vis => vis.prisonerNumber === prisoner.prisonerNumber)
      const activities = scheduledEvents?.activities.filter(act => act.prisonerNumber === prisoner.prisonerNumber)
      const allEventsForPrisoner = [...appointments, ...courtHearings, ...visits, ...activities]

      return {
        ...prisoner,
        displayName: convertToTitleCase(`${prisoner.lastName}, ${prisoner.firstName}`),
        events: this.sortByPriority(allEventsForPrisoner),
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
    const leavingEventTypes = ['COURT_HEARING', 'TRANSFER', 'ADJUDICATION_HEARING', 'VISIT']
    const eventsOffWing = item.events.filter(ev => leavingEventTypes.includes(ev.eventType))
    if (eventsOffWing.length > 0) {
      return true
    }

    // TODO: Check rules. In-cell activities / appointments do not have a prison location id?
    // Probably need to get and check the in-cell marker for both of these - when they are included
    const activitiesAndAppointments = item.events.filter(ev => ['ACTIVITY', 'APPOINTMENT'].includes(ev.eventType))
    const activitiesOffWing = activitiesAndAppointments.filter(aa => !aa.locationId)
    return activitiesOffWing.length > 0
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

  private sortByPriority = (data: ScheduledEvent[]): ScheduledEvent[] => {
    return data.sort((p1, p2) => {
      if (p1.priority > p2.priority) return 1
      if (p1.priority < p2.priority) return -1
      return 0
    })
  }
}
