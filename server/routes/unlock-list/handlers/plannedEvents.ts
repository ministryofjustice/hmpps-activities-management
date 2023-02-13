import { Request, Response } from 'express'
// eslint-disable-next-line import/no-cycle
import ActivitiesService from '../../../services/activitiesService'
import UnlockListService from '../../../services/unlockListService'
import { toDate, formatDate } from '../../../utils/utils'
import logger from '../../../../logger'
import { UnlockFilterItem, UnlockFilters } from '../../../@types/activities'

export default class PlannedEventsRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly unlockListService: UnlockListService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { date, slot, location } = req.query
    const formattedDate = formatDate(toDate(date.toString()), 'cccc do LLLL y')
    const locationGroup: string = (location as string) || undefined
    let { unlockFilters } = req.session

    // Get the main location group selected and its child-locations, if any present (e.g. HB1 -> A-Wing, B-Wing)
    const locationsAtPrison = await this.activitiesService.getLocationGroups(user.activeCaseLoadId, user)
    const subLocations = locationsAtPrison.filter(loc => loc.name === locationGroup)[0].children.map(loc => loc.name)

    if (!unlockFilters) {
      unlockFilters = defaultUnlockFilters(subLocations)
      req.session.unlockFilters = unlockFilters
    }

    logger.info(`UnlockFilters: ${JSON.stringify(unlockFilters)}`)

    const unlockListItems = await this.unlockListService.getFilteredUnlockList(
      locationGroup,
      subLocations,
      unlockFilters,
      date.toString(),
      slot.toString(),
      user,
    )

    res.render('pages/unlock-list/planned-events', {
      locationGroup,
      unlockFilters,
      unlockListItems,
      plannedDate: formattedDate,
      plannedSlot: slot,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { unlockFilters } = req.session

    logger.info(`POST body = ${JSON.stringify(req.body)} user ${user.name}`)

    const newFilters = applyFiltersFromPost(
      unlockFilters,
      req.body?.subLocations,
      req.body?.activityNames,
      req.body?.stayingOrLeaving,
    )

    req.session.unlockFilters = newFilters

    logger.info(`Filters = ${JSON.stringify(unlockFilters)}`)

    return res.redirect(
      `planned-events?datePresetOption=${req.query.datePresetOption}` +
        `&date=${req.query.date}` +
        `&slot=${req.query.slot}` +
        `&location=${req.query.location}`,
    )
  }
}

const applyFiltersFromPost = (
  oldFilters: UnlockFilters,
  locations: string | string[],
  activities: string | string[],
  stayingOrLeaving: string | string[],
): UnlockFilters => {
  logger.info(`TODO - apply post values to filters ${locations} - ${activities} - ${stayingOrLeaving}`)
  // TODO: Translate body values into UnlockFilters object
  return oldFilters
}

const defaultUnlockFilters = (childLocations: string[]): UnlockFilters => {
  const realSubLocations = childLocations.map(loc => {
    return { value: loc, text: loc, checked: false } as UnlockFilterItem
  })
  const subLocations = [{ value: 'All', text: 'All', checked: true } as UnlockFilterItem, ...realSubLocations]
  const activityNames = [{ value: 'All', text: 'All', checked: true }] as UnlockFilterItem[]
  const stayingOrLeaving = [
    { value: 'All', text: 'All', checked: true },
    { value: 'Staying', text: 'Staying', checked: false },
    { value: 'Leaving', text: 'Leaving', checked: false },
  ] as UnlockFilterItem[]

  return { subLocations, activityNames, stayingOrLeaving }
}
