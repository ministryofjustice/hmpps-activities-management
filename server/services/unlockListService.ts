import { SubLocationCellPattern, UnlockListItem, YesNo } from '../@types/activities'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import ActivitiesApiClient from '../data/activitiesApiClient'
import { ServiceUser } from '../@types/express'
import { scheduledEventSort, toDateString, eventClashes } from '../utils/utils'
import AlertsFilterService from './alertsFilterService'
import applyCancellationDisplayRule from '../utils/applyCancellationDisplayRule'

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
    activityCategoriesFilters: string[],
    stayingOrLeavingFilter: string,
    alertFilters: string[],
    searchTerm: string,
    cancelledEventsFilter: YesNo,
    activityCategoryFilterBeingUsed: boolean,
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
        middleNames: prisoner.middleNames,
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

    // populate an array of prisoners with events in any searched activity
    // if a prisoner has any category in the list the event should be added to the unlock items
    const prisonersInAnyActivityCategory: string[] = []
    filteredPrisoners.forEach(prisoner => {
      const activities = scheduledEvents?.activities.filter(act => act.prisonerNumber === prisoner.prisonerNumber)
      activities.forEach(act => {
        if (activityCategoriesFilters.includes(act.categoryCode)) {
          prisonersInAnyActivityCategory.push(act.prisonerNumber)
        }
      })
    })

    let unlockListItems: UnlockListItem[] = []

    if (activityCategoryFilterBeingUsed) {
      unlockListItems = filteredPrisoners.map(prisoner => {
        const activities = scheduledEvents?.activities
          .filter(act => act.prisonerNumber === prisoner.prisonerNumber)
          .filter(act => prisonersInAnyActivityCategory.includes(act.prisonerNumber))
          .filter(act => !act.cancelled || cancelledEventsFilter === YesNo.YES)

        const appointments = scheduledEvents?.appointments
          .filter(app => app.prisonerNumber === prisoner.prisonerNumber)
          .filter(app => applyCancellationDisplayRule(app))
          .filter(app => !app.cancelled || cancelledEventsFilter === YesNo.YES)

        const clashingApptsToShow = []
        activities.forEach(act => {
          const clashingApps = appointments.filter(app => eventClashes(act, app))
          // if there are any appointments for the prisoner that clash with the activities that match the chosen filter, include them in the results
          if (clashingApps.length) {
            clashingApps.forEach(clashingAppointment => {
              if (
                // don't add the appointment if it's already in the array
                !clashingApptsToShow.find(app => app.scheduledInstanceId === clashingAppointment.scheduledInstanceId)
              ) {
                clashingApptsToShow.push(clashingAppointment)
              }
            })
          }
        })

        const events = [...activities, ...clashingApptsToShow]

        return {
          ...prisoner,
          isLeavingWing: this.isLeaving(events),
          events: scheduledEventSort(events),
        } as UnlockListItem
      })
    } else {
      // Match the prisoners with their events by prisonerNumber
      unlockListItems = filteredPrisoners.map(prisoner => {
        const appointments = scheduledEvents?.appointments
          .filter(app => app.prisonerNumber === prisoner.prisonerNumber)
          .filter(app => applyCancellationDisplayRule(app))
          .filter(app => !app.cancelled || cancelledEventsFilter === YesNo.YES)
        const courtHearings = scheduledEvents?.courtHearings
          .filter(crt => crt.prisonerNumber === prisoner.prisonerNumber)
          .filter(crt => !crt.cancelled || cancelledEventsFilter === YesNo.YES)
        const visits = scheduledEvents?.visits
          .filter(vis => vis.prisonerNumber === prisoner.prisonerNumber)
          .filter(vis => !vis.cancelled || cancelledEventsFilter === YesNo.YES)
        const adjudications = scheduledEvents?.adjudications
          .filter(adj => adj.prisonerNumber === prisoner.prisonerNumber)
          .filter(adj => !adj.cancelled || cancelledEventsFilter === YesNo.YES)
        const transfers = scheduledEvents?.externalTransfers
          .filter(tra => tra.prisonerNumber === prisoner.prisonerNumber)
          .filter(tra => !tra.cancelled || cancelledEventsFilter === YesNo.YES)
        const activities = scheduledEvents?.activities
          .filter(act => act.prisonerNumber === prisoner.prisonerNumber)
          .filter(act => prisonersInAnyActivityCategory.includes(act.prisonerNumber))
          .filter(act => !act.cancelled || cancelledEventsFilter === YesNo.YES)
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
    }

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
    for (const cellPattern of cellPatterns) {
      const splitPatterns = cellPattern.locationPrefix.split(',')

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
