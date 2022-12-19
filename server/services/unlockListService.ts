import PrisonApiClient from '../data/prisonApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import ActivitiesApiClient from '../data/activitiesApiClient'
import { UnlockListItem } from '../@types/activities'
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

  async getUnlockListForLocationGroups(
    locationGroups: string[],
    unlockDate: string,
    slot: string,
    user: ServiceUser,
  ): Promise<UnlockListItem[]> {
    // Convert the selected location groups to the location prefixes at this prison e.g. ["MDI-1-","MDI-2-"]
    const locationPrefixes = (
      await Promise.all(
        locationGroups.map(lg =>
          this.activitiesApiClient.getPrisonLocationPrefixByGroup(user.activeCaseLoadId, lg, user),
        ),
      )
    ).map(lp => lp.locationPrefix)

    // TODO: Check that the length of the locationGroups is the same as the locationPrefixes - missed any?

    // Get the prisoners whose cell locations match any of the location prefixes
    const prisonersByCellLocation = await Promise.all(
      locationPrefixes.map(locPrefix => {
        return this.prisonerSearchApiClient.searchPrisonersByLocationPrefix(
          user.activeCaseLoadId,
          locPrefix,
          0,
          1024,
          user,
        )
      }),
    )

    // TODO: Match the location groups and prefixes to the prisoner pages here (for filtering on the page)

    // Build one list of all prisoners from the multiple lists of search results
    const prisoners = prisonersByCellLocation.flatMap(page => {
      return page?.content?.map(prisoner => {
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
        } as unknown as UnlockListItem
      })
    })

    // Get the scheduled events from their master source for these prisoners (court, visits, appointments)
    const scheduledEvents = await this.activitiesApiClient.getScheduledEventsByPrisonerNumbers(
      user.activeCaseLoadId,
      unlockDate,
      slot,
      prisoners.map(p => p.prisonerNumber),
      user,
    )

    // TODO: Get activities - similar shape within scheduled events - in the API call for scheduled events
    // TODO: Get transfers - similar shape as scheduled events
    // TODO: Adjudication hearings (currently in appointments, check with Adjudications team for rolled-out prisons)
    // TODO: Get ROTLs - Prison API: /api/movements/agency/{prisonCode}/temporary-absences - filtered to today?

    // Match the prisoners with their events by prisonerNumber
    const unlockListItems = prisoners.map(prisoner => {
      const appointments = scheduledEvents?.appointments.filter(app => app.prisonerNumber === prisoner.prisonerNumber)
      const courtHearings = scheduledEvents?.courtHearings.filter(app => app.prisonerNumber === prisoner.prisonerNumber)
      const visits = scheduledEvents?.visits.filter(app => app.prisonerNumber === prisoner.prisonerNumber)
      const allEventsForPrisoner = [...appointments, ...courtHearings, ...visits]
      return {
        ...prisoner,
        displayName: convertToTitleCase(`${prisoner.lastName}, ${prisoner.firstName}`),
        events: this.sortByPriority(allEventsForPrisoner),
      } as UnlockListItem
    })

    logger.info(`Number of unlock list items ${unlockListItems?.length}`)

    return unlockListItems
  }

  private sortByPriority = (data: ScheduledEvent[]) => {
    return data.sort((p1, p2) => {
      if (p1.priority > p2.priority) return 1
      if (p1.priority < p2.priority) return -1
      return 0
    })
  }
}
