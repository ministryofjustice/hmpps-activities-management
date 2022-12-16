import PrisonApiClient from '../data/prisonApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import ActivitiesApiClient from '../data/activitiesApiClient'
import { UnlockListItem } from '../@types/activities'
import { ServiceUser } from '../@types/express'
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
        locationGroups.map(lg => {
          return this.activitiesApiClient.getPrisonLocationPrefixByGroup(user.activeCaseLoadId, lg, user)
        }),
      )
    ).map(lp => lp.locationPrefix)

    // Check that the length of the locationGroups is the same as the locationPrefixes - missed any?
    logger.info(`Location groups ${locationGroups} Location prefixes ${locationPrefixes.toString()}`)

    // Get the prisoner details whose cell locations match any of these location prefixes
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

    logger.info(`Prisoners : Length - number of return sets ${prisonersByCellLocation.length}`)

    // Build a list of prisoner details from the search results
    const prisoners = prisonersByCellLocation
      .map(page => {
        return page.content.map(prisoner => {
          return {
            prisonerNumber: prisoner.prisonerNumber,
            bookingId: prisoner.bookingId,
            firstName: prisoner.firstName,
            lastName: prisoner.lastName,
            cellLocation: prisoner.cellLocation,
            category: prisoner.category,
            incentiveLevel: prisoner.currentIncentive,
            alerts: prisoner.alerts,
            status: 'UNKNOWN',
            prisonCode: prisoner.prisonId,
          }
        })
      })
      .flat()

    logger.info(`Prisoners in total = ${prisoners.length}`)

    prisoners.map(p => logger.info(`ID : ${p.prisonerNumber} cell: ${p.cellLocation}`))

    const prisonerNumbers = prisoners.map(p => p.prisonerNumber)

    // Get the planned events for these prisoners (court, visits, appointments, adjudications)
    const scheduledEvents = await this.activitiesApiClient.getScheduledEventsByPrisonerNumbers(
      user.activeCaseLoadId,
      unlockDate,
      slot,
      prisonerNumbers,
      user,
    )

    // Get Transfers? ROTLs? Releases?
    // Prison API: /api/movements/agency/{prisonCode}/temporary-absences - filtered to today

    logger.info(`Scheduled events ${JSON.stringify(scheduledEvents)}`)

    // Match the lists on bookingId or prisonerNumber or cell-location
    // Filter by time-slot
    // Sort activities per prisoner by priority
    // Build the UnlockList[] to return
    //  UnlockListItem = {
    //   prisonerNumber: string
    //   bookingId: number
    //   firstName: string
    //   lastName: string
    //   locationGroup: string
    //   locationPrefix: string
    //   cellLocation: string
    //   alerts: Alert[]
    //   events: ScheduledActivity[]
    //   status: string
    // }

    return []
  }
}
