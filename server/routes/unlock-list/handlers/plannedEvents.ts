import { Request, Response } from 'express'
// eslint-disable-next-line import/no-cycle
import ActivitiesService from '../../../services/activitiesService'
import UnlockListService from '../../../services/unlockListService'
import { toDate, formatDate, convertToArray } from '../../../utils/utils'
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

    // Set the default unlock filters if not already present in the user's session
    if (!unlockFilters) {
      unlockFilters = defaultUnlockFilters(subLocations)
      req.session.unlockFilters = unlockFilters
    }

    logger.info(`UnlockFilters: ${JSON.stringify(unlockFilters)}`)

    // Get the filtered unlock list
    const unlockListItems = await this.unlockListService.getFilteredUnlockList(
      locationGroup,
      subLocations,
      unlockFilters,
      date.toString(),
      slot.toString(),
      user,
    )

    // Render unlock list with current filters set
    res.render('pages/unlock-list/planned-events', {
      locationGroup,
      unlockFilters,
      unlockListItems,
      plannedDate: formattedDate,
      plannedSlot: slot,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    // The only values posted here are changes to the filtering options
    const { user } = res.locals
    const { unlockFilters } = req.session

    logger.info(`POST body = ${JSON.stringify(req.body)} user ${user.name}`)

    // Get the changed filter options from the POST body to create new filters
    const newFilters = parseFiltersFromPost(
      unlockFilters,
      req.body?.sublocations,
      req.body?.activityNames,
      req.body?.stayingOrLeaving,
    )

    // Save the new filters on the user's session
    req.session.unlockFilters = newFilters

    // Redirect to display unlock list with new filters
    return res.redirect(
      `planned-events?datePresetOption=${req.query.datePresetOption}` +
        `&date=${req.query.date}` +
        `&slot=${req.query.slot}` +
        `&location=${req.query.location}`,
    )
  }
}

const parseFiltersFromPost = (
  oldFilters: UnlockFilters,
  locations: string | string[],
  activities: string | string[],
  staying: string | string[],
): UnlockFilters => {
  // Convert the posted body values into filter options
  const subLocations = oldFilters.subLocations.map(loc => {
    const checked = convertToArray(locations).includes(loc.value)
    return { value: loc.value, text: loc.text, checked } as UnlockFilterItem
  })

  const activityNames = oldFilters.activityNames.map(act => {
    const checked = convertToArray(activities).includes(act.value)
    return { value: act.value, text: act.text, checked } as UnlockFilterItem
  })

  const stayingOrLeaving = oldFilters.stayingOrLeaving.map(stay => {
    const checked = convertToArray(staying).includes(stay.value)
    return { value: stay.value, text: stay.text, checked } as UnlockFilterItem
  })

  // Return the new filter object
  return { subLocations, activityNames, stayingOrLeaving } as UnlockFilters
}

const defaultUnlockFilters = (childLocations: string[]): UnlockFilters => {
  const realSubLocations = childLocations.map(loc => {
    return { value: loc, text: loc, checked: false } as UnlockFilterItem
  })
  const subLocations = [{ value: 'All', text: 'All', checked: true } as UnlockFilterItem, ...realSubLocations]
  const activityNames = [{ value: 'All', text: 'All', checked: true }] as UnlockFilterItem[]
  const stayingOrLeaving = [
    { value: 'Both', text: 'Staying and leaving', checked: true },
    { value: 'Staying', text: 'Staying', checked: false },
    { value: 'Leaving', text: 'Leaving', checked: false },
  ] as UnlockFilterItem[]

  return { subLocations, activityNames, stayingOrLeaving }
}
