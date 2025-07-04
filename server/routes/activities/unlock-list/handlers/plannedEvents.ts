import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import UnlockListService from '../../../../services/unlockListService'
import { asString, toDate } from '../../../../utils/utils'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'
import AlertsFilterService from '../../../../services/alertsFilterService'
import { YesNo } from '../../../../@types/activities'

export default class PlannedEventsRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly unlockListService: UnlockListService,
    private readonly metricsService: MetricsService,
    private readonly alertsFilterService: AlertsFilterService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { date } = req.query
    const { locationKey, timeSlot } = req.session.unlockListJourney

    const location = await this.activitiesService
      .getLocationGroups(user)
      .then(locations => locations.find(loc => loc.key === locationKey))

    const activityCategories = await this.activitiesService.getActivityCategories(user)

    const alertOptions = this.alertsFilterService.getAllAlertFilterOptions()

    // Set the default filter values if they are not set
    req.session.unlockListJourney.stayingOrLeavingFilter ??= 'Both'
    req.session.unlockListJourney.activityFilter ??= 'With'
    req.session.unlockListJourney.activityCategoriesFilters ??= activityCategories.map(c => c.code)
    req.session.unlockListJourney.subLocationFilters ??= location.children.map(c => c.key)
    req.session.unlockListJourney.alertFilters ??= alertOptions.map(a => a.key)
    req.session.unlockListJourney.searchTerm ??= ''
    req.session.unlockListJourney.cancelledEventsFilter ??= YesNo.YES

    const unlockDate = date ? toDate(asString(date)) : new Date()

    // we need to know if the user is filtering on activity category, if they are we will only return activities and ignore other event types
    const activityCategoryFilterBeingUsed =
      req.session.unlockListJourney.activityCategoriesFilters.length !== activityCategories.length

    const {
      subLocationFilters,
      activityFilter,
      activityCategoriesFilters,
      stayingOrLeavingFilter,
      alertFilters,
      searchTerm,
      cancelledEventsFilter,
    } = req.session.unlockListJourney

    const unlockListItems = await this.unlockListService.getFilteredUnlockList(
      unlockDate,
      timeSlot,
      locationKey,
      subLocationFilters,
      activityFilter,
      activityCategoriesFilters,
      stayingOrLeavingFilter,
      alertFilters,
      searchTerm,
      cancelledEventsFilter,
      activityCategoryFilterBeingUsed,
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
      activityCategories,
      unlockListItems,
      movementCounts,
      alertOptions,
    })
  }
}
