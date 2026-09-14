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

    const [subLocationCellPatterns, { locationPrefix }] = await Promise.all([
      this.activitiesApiClient.getPrisonLocationPrefixesByGroups(prison, location, subLocationFilters, user),
      this.activitiesApiClient.getPrisonLocationPrefixByGroup(prison, location, user),
    ])

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
    const prisoners = results.content.map(prisoner => {
      return {
        prisonerNumber: prisoner.prisonerNumber,
        bookingId: prisoner.bookingId,
        firstName: prisoner.firstName,
        lastName: prisoner.lastName,
        middleNames: prisoner.middleNames,
        cellLocation: prisoner.cellLocation,
        category: this.alertsFilterService.getFilteredCategory(alertFilters, prisoner.category),
        incentiveLevel: prisoner.currentIncentive,
        alerts: this.alertsFilterService.getFilteredAlerts(alertFilters, prisoner.alerts),
        status: prisoner.inOutStatus,
        prisonCode: prisoner.prisonId,
        locationGroup: location,
        locationSubGroup: this.getSubLocationFromCell(prison, subLocationCellPatterns, prisoner.cellLocation),
      } as unknown as UnlockListItem
    })

    const filteredPrisoners = prisoners.filter(
      prisoner => subLocationFilters.length === 0 || subLocationFilters.includes(prisoner.locationSubGroup),
    )

    const scheduledEvents = await this.activitiesApiClient.getScheduledEventsByPrisonerNumbers(
      prison,
      toDateString(date),
      filteredPrisoners.map(prisoner => prisoner.prisonerNumber),
      user,
      timeSlot,
      true,
    )

    const activitiesByPrisoner = new Map<string, typeof scheduledEvents.activities>()

    scheduledEvents.activities.forEach(activity => {
      const activities = activitiesByPrisoner.get(activity.prisonerNumber) ?? []
      activities.push(activity)
      activitiesByPrisoner.set(activity.prisonerNumber, activities)
    })

    const appointmentsByPrisoner = new Map<string, typeof scheduledEvents.appointments>()

    scheduledEvents.appointments.forEach(appointment => {
      const appointments = appointmentsByPrisoner.get(appointment.prisonerNumber) ?? []
      appointments.push(appointment)
      appointmentsByPrisoner.set(appointment.prisonerNumber, appointments)
    })

    const courtHearingsByPrisoner = new Map<string, typeof scheduledEvents.courtHearings>()

    scheduledEvents.courtHearings.forEach(courtHearing => {
      const courtHearings = courtHearingsByPrisoner.get(courtHearing.prisonerNumber) ?? []

      courtHearings.push(courtHearing)
      courtHearingsByPrisoner.set(courtHearing.prisonerNumber, courtHearings)
    })

    const visitsByPrisoner = new Map<string, typeof scheduledEvents.visits>()

    scheduledEvents.visits.forEach(visit => {
      const visits = visitsByPrisoner.get(visit.prisonerNumber) ?? []
      visits.push(visit)
      visitsByPrisoner.set(visit.prisonerNumber, visits)
    })

    const adjudicationsByPrisoner = new Map<string, typeof scheduledEvents.adjudications>()

    scheduledEvents.adjudications.forEach(adjudication => {
      const adjudications = adjudicationsByPrisoner.get(adjudication.prisonerNumber) ?? []

      adjudications.push(adjudication)
      adjudicationsByPrisoner.set(adjudication.prisonerNumber, adjudications)
    })

    const transfersByPrisoner = new Map<string, typeof scheduledEvents.externalTransfers>()

    scheduledEvents.externalTransfers.forEach(transfer => {
      const transfers = transfersByPrisoner.get(transfer.prisonerNumber) ?? []
      transfers.push(transfer)
      transfersByPrisoner.set(transfer.prisonerNumber, transfers)
    })

    const prisonersInAnyActivityCategory = new Set(
      scheduledEvents.activities
        .filter(activity => activityCategoriesFilters.includes(activity.categoryCode))
        .map(activity => activity.prisonerNumber),
    )

    let unlockListItems: UnlockListItem[] = []

    if (activityCategoryFilterBeingUsed) {
      unlockListItems = filteredPrisoners.map(prisoner => {
        const activities = prisonersInAnyActivityCategory.has(prisoner.prisonerNumber)
          ? (activitiesByPrisoner.get(prisoner.prisonerNumber) ?? []).filter(
              activity => !activity.cancelled || cancelledEventsFilter === YesNo.YES,
            )
          : []

        const appointments = (appointmentsByPrisoner.get(prisoner.prisonerNumber) ?? [])
          .filter(applyCancellationDisplayRule)
          .filter(appointment => !appointment.cancelled || cancelledEventsFilter === YesNo.YES)

        const clashingApptsToShow = []

        activities.forEach(activity => {
          const clashingAppointments = appointments.filter(appointment => eventClashes(activity, appointment))

          clashingAppointments.forEach(clashingAppointment => {
            if (
              !clashingApptsToShow.find(
                appointment => appointment.scheduledInstanceId === clashingAppointment.scheduledInstanceId,
              )
            ) {
              clashingApptsToShow.push(clashingAppointment)
            }
          })
        })

        const events = [...activities, ...clashingApptsToShow]

        return {
          ...prisoner,
          isLeavingWing: this.isLeaving(events),
          events: scheduledEventSort(events),
        } as UnlockListItem
      })
    } else {
      unlockListItems = filteredPrisoners.map(prisoner => {
        const isCancelled = event => event.cancelled || event.status === 'Cancelled' || event.status === 'Paused'

        const isCancellationShown = event => !isCancelled(event) || cancelledEventsFilter === YesNo.YES

        const appointments = (appointmentsByPrisoner.get(prisoner.prisonerNumber) ?? [])
          .filter(applyCancellationDisplayRule)
          .filter(appointment => !appointment.cancelled || cancelledEventsFilter === YesNo.YES)

        const courtHearings = (courtHearingsByPrisoner.get(prisoner.prisonerNumber) ?? []).filter(
          courtHearing => !courtHearing.cancelled || cancelledEventsFilter === YesNo.YES,
        )

        const visits = (visitsByPrisoner.get(prisoner.prisonerNumber) ?? []).filter(
          visit => !visit.cancelled || cancelledEventsFilter === YesNo.YES,
        )

        const adjudications = (adjudicationsByPrisoner.get(prisoner.prisonerNumber) ?? []).filter(
          adjudication => !adjudication.cancelled || cancelledEventsFilter === YesNo.YES,
        )

        const transfers = (transfersByPrisoner.get(prisoner.prisonerNumber) ?? []).filter(
          transfer => !transfer.cancelled || cancelledEventsFilter === YesNo.YES,
        )

        const activities = (activitiesByPrisoner.get(prisoner.prisonerNumber) ?? []).filter(isCancellationShown)

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
        item =>
          activityFilter === 'Both' ||
          (activityFilter === 'With' && item.events.length > 0) ||
          (activityFilter === 'Without' && item.events.length === 0),
      )
      .filter(
        item =>
          stayingOrLeavingFilter === 'Both' ||
          (stayingOrLeavingFilter === 'Leaving' && item.isLeavingWing) ||
          (stayingOrLeavingFilter === 'Staying' && !item.isLeavingWing),
      )
      .filter(
        item =>
          !searchTermLowerCase ||
          item.prisonerName?.toLowerCase().includes(searchTermLowerCase) ||
          item.prisonerNumber?.toLowerCase().includes(searchTermLowerCase) ||
          item.events?.find(event => event.summary?.toLowerCase().includes(searchTermLowerCase)),
      )
  }

  private isLeaving = (events: UnlockListItem['events']): boolean => {
    if (events.length === 0) {
      return false
    }

    // TODO: Check rules - event types which are always off-wing?
    const leavingEventTypes = ['COURT_HEARING', 'EXTERNAL_TRANSFER', 'ADJUDICATION_HEARING', 'VISIT']

    if (events.some(event => leavingEventTypes.includes(event.eventType))) {
      return true
    }

    // If it's not an off-wing event, check if the event location is off-wing
    return events.some(event => !event.inCell && !event.onWing && !event.internalLocationCode?.includes('WOW'))
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
