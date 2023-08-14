import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import UnlockListService from '../../../../services/unlockListService'
import { toDate } from '../../../../utils/utils'
import AppInsightsService from '../../../../services/AppInsightsService'

export default class PlannedEventsRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly unlockListService: UnlockListService,

    private readonly appInsightsClient: AppInsightsService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    this.trackEvent('saaUnlockList', res)

    const { user } = res.locals
    const { date } = req.query
    const { location, timeSlot } = req.session.unlockListJourney

    const subLocations = await this.activitiesService
      .getLocationGroups(user)
      .then(locations => locations.find(loc => loc.name === location).children.map(loc => loc.name))

    // Set the default filter values if they are not set
    req.session.unlockListJourney.stayingOrLeavingFilter ??= 'Both'
    req.session.unlockListJourney.activityFilter ??= 'Both'
    req.session.unlockListJourney.subLocationFilters ??= subLocations

    const unlockDate = toDate(date as string)

    const { subLocationFilters, activityFilter, stayingOrLeavingFilter } = req.session.unlockListJourney

    const unlockListItems = await this.unlockListService.getFilteredUnlockList(
      unlockDate,
      timeSlot,
      location,
      subLocationFilters,
      activityFilter,
      stayingOrLeavingFilter,
      user,
    )

    const leavingWingCount = unlockListItems.filter(item => item.isLeavingWing).length
    const movementCounts = {
      leavingWing: leavingWingCount,
      stayingOnWing: unlockListItems.length - leavingWingCount,
    }

    res.render('pages/activities/unlock-list/planned-events', {
      date,
      timeSlot,
      location,
      subLocations,
      unlockListItems,
      movementCounts,
    })
  }

  private trackEvent(eventName: string, res: Response): void {
    const properties = { user: res.locals.user.username, prisonCode: res.locals.user.prisonCode }
    this.appInsightsClient.trackEvent(eventName, properties)
  }
}
