import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import UnlockListService from '../../../../services/unlockListService'
import { asString, toDate } from '../../../../utils/utils'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'

export default class PlannedEventsRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly unlockListService: UnlockListService,
    private readonly metricsService: MetricsService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { date } = req.query
    const { locationKey, timeSlot } = req.session.unlockListJourney

    const location = await this.activitiesService
      .getLocationGroups(user)
      .then(locations => locations.find(loc => loc.key === locationKey))

    // Set the default filter values if they are not set
    req.session.unlockListJourney.stayingOrLeavingFilter ??= 'Both'
    req.session.unlockListJourney.activityFilter ??= 'With'
    req.session.unlockListJourney.subLocationFilters ??= location.children.map(c => c.key)
    req.session.unlockListJourney.showAlerts ??= true

    const unlockDate = date ? toDate(asString(date)) : new Date()

    const { subLocationFilters, activityFilter, stayingOrLeavingFilter } = req.session.unlockListJourney

    const unlockListItems = await this.unlockListService.getFilteredUnlockList(
      unlockDate,
      timeSlot,
      locationKey,
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

    this.metricsService.trackEvent(
      MetricsEvent.CREATE_UNLOCK_LIST(unlockDate, timeSlot, location.name, unlockListItems.length, res.locals.user),
    )

    res.render('pages/activities/unlock-list/planned-events', {
      date,
      timeSlot,
      location,
      unlockListItems,
      movementCounts,
    })
  }
}
