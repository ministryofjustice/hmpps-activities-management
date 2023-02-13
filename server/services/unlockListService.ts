// eslint-disable-next-line import/no-cycle
import PrisonApiClient from '../data/prisonApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import ActivitiesApiClient from '../data/activitiesApiClient'
import { SubLocationCellPattern, UnlockFilters, UnlockListItem } from '../@types/activities'
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

  async getFilteredUnlockList(
    locationGroup: string,
    subLocations: string[],
    unlockFilters: UnlockFilters,
    unlockDate: string,
    slot: string,
    user: ServiceUser,
  ): Promise<UnlockListItem[]> {
    const prison = user.activeCaseLoadId

    // Get the cell-location prefix for the main location group e.g. Houseblock 1 = MDI-1-
    const locationGroupPrefix = await this.activitiesApiClient.getPrisonLocationPrefixByGroup(
      prison,
      locationGroup,
      user,
    )

    // Get the cell-matching regexp patterns for each of the subgroups for the main location e.g [A-Wing, B-Wing C-Wing]
    const subLocationCellPatterns = await Promise.all(
      subLocations.map(async sub => {
        const locGroup = `${locationGroup}_${sub}`
        const prefix = await this.activitiesApiClient.getPrisonLocationPrefixByGroup(prison, locGroup, user)
        return { subLocation: sub, locationPrefix: prefix.locationPrefix } as SubLocationCellPattern
      }),
    )

    logger.info(`SubLocationCellPatterns = ${JSON.stringify(subLocationCellPatterns)}`)

    // Get all prisoners located in the main location group e.g. "Houseblock 1" by prefix MDI-1-
    const results = await this.prisonerSearchApiClient.searchPrisonersByLocationPrefix(
      prison,
      locationGroupPrefix.locationPrefix,
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
        locationGroup,
        locationSubGroup: this.getSubLocationFromCell(prison, subLocationCellPatterns, prisoner?.cellLocation),
      } as unknown as UnlockListItem
    })

    // Filter the list to those sub locations in the unlock list filters
    const locationFilters = unlockFilters.subLocations.filter(loc => loc.checked === true).map(loc => loc.value)
    const filteredPrisoners = locationFilters.includes('All')
      ? prisoners
      : prisoners.filter(prisoner => locationFilters.includes(prisoner.locationSubGroup) === true)

    /*
    TODO: Re-instate this when implementing the staying or leaving filter on appointments/activities
    const inCellFilters = unlockFilters.stayingOrLeaving
      .filter(inCell => inCell.checked === true)
      .map(inCell => inCell.value)
    const staying = inCellFilters.includes('All') || inCellFilters.includes('Staying')
    const leaving = inCellFilters.includes('All') || inCellFilters.includes('Leaving')
     */

    // Get the scheduled events from their master source for these prisoners (activities, court, visits, appointments)
    const scheduledEvents = await this.activitiesApiClient.getScheduledEventsByPrisonerNumbers(
      prison,
      unlockDate,
      filteredPrisoners.map(p => p.prisonerNumber),
      user,
      slot,
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

    logger.info(`Number of unlock list items ${unlockListItems?.length}`)

    return unlockListItems
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
    logger.error(`No sub-location match for cell location ${prison}-${cellLocation} - check API location mapping`)
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
