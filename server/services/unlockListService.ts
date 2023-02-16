import { SubLocationCellPattern, UnlockFilters, UnlockListItem } from '../@types/activities'
import PrisonApiClient from '../data/prisonApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import ActivitiesApiClient from '../data/activitiesApiClient'
import { ServiceUser } from '../@types/express'
import { ScheduledEvent } from '../@types/activitiesAPI/types'
import { convertToTitleCase } from '../utils/utils'
import logger from '../../logger'

export default class UnlockListService {
  constructor(
    private readonly prisonApiClient: PrisonApiClient,
    private readonly prisonerSearchApiClient: PrisonerSearchApiClient,
    private readonly activitiesApiClient: ActivitiesApiClient,
  ) {}

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

    logger.info(`Prisoner search results count = ${results.totalElements}`)

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
        alerts: prisoner?.alerts,
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
      unlockFilters.unlockDate,
      filteredPrisoners.map(p => p.prisonerNumber),
      user,
      unlockFilters.timeSlot,
    )

    logger.info(`Total activities: ${scheduledEvents?.activities.length}`)
    logger.info(`Total visits: ${scheduledEvents?.visits.length}`)
    logger.info(`Total appointments: ${scheduledEvents?.appointments.length}`)
    logger.info(`Total court hearings: ${scheduledEvents?.courtHearings.length}`)

    // TODO: Adjudication hearings (Check with Adjudications team for rolled-out prisons and API options)
    // TODO: Get ROTLs - Prison API: /api/movements/agency/{prisonCode}/temporary-absences - filtered to today?

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

    // Apply filter for with or without activities in this time slot
    const withActivityFilters = unlockFilters.activityFilters.filter(act => act.checked === true).map(act => act.value)
    const withActivities = withActivityFilters.includes('With')
    const filteredUnlockListItems = withActivityFilters.includes('Both')
      ? unlockListItems
      : unlockListItems.filter(item => (withActivities ? item.events.length > 0 : item.events.length === 0))

    // TODO: Apply filter for staying or leaving (an event, its type and locaction in relation to cell-location)

    logger.info(`Number of unlock list items ${filteredUnlockListItems?.length}`)

    return filteredUnlockListItems
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
