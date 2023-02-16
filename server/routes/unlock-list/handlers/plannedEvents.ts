import { Request, Response } from 'express'
import { UnlockFilterItem, UnlockFilters } from '../../../@types/activities'
import ActivitiesService from '../../../services/activitiesService'
import UnlockListService from '../../../services/unlockListService'
import { toDate, formatDate, convertToArray } from '../../../utils/utils'

export default class PlannedEventsRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly unlockListService: UnlockListService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { date, slot, location } = req.query
    const formattedDate = formatDate(toDate(date.toString()), 'cccc do LLLL y')
    const locationName: string = (location as string) || undefined
    let { unlockFilters } = req.session

    if (!unlockFilters) {
      const [prefix, locationsAtPrison] = await Promise.all([
        this.activitiesService.getLocationPrefix(locationName, user),
        this.activitiesService.getLocationGroups(user),
      ])

      const subLocations = locationsAtPrison.filter(loc => loc.name === locationName)[0].children.map(loc => loc.name)
      unlockFilters = defaultFilters(
        locationName,
        prefix.locationPrefix,
        date.toString(),
        formattedDate,
        slot.toString(),
        subLocations,
      )

      req.session.unlockFilters = unlockFilters
    }

    // TODO: Caching of unlockListItems here - check and refresh if necessary - 10 mins?
    const unlockListItems = await this.unlockListService.getFilteredUnlockList(unlockFilters, user)

    res.render('pages/unlock-list/planned-events', { unlockFilters, unlockListItems })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    // The only values posted here are changes to the filtering options
    const { unlockFilters } = req.session
    const { date, slot, location } = req.query

    if (unlockFilters) {
      req.session.unlockFilters = parseFiltersFromPost(
        unlockFilters,
        req.body?.locationFilters,
        req.body?.activityFilters,
        req.body?.stayingOrLeavingFilters,
      )
      res.redirect(`planned-events?date=${date}&slot=${slot}&location=${location}`)
    } else {
      res.redirect(`select-date-and-location`)
    }
  }

  FILTERS = async (req: Request, res: Response): Promise<void> => {
    // GET requests to remove selected filters by clicking 'x' tags
    const { clearFilters, clearLocation, clearActivity, clearStaying } = req.query
    let { unlockFilters } = req.session

    if (unlockFilters) {
      unlockFilters = amendFilters(
        unlockFilters,
        clearFilters as string,
        clearLocation as string,
        clearActivity as string,
        clearStaying as string,
      )

      const { unlockDate, timeSlot, location } = unlockFilters
      req.session.unlockFilters = unlockFilters

      res.redirect(`planned-events?date=${unlockDate}&slot=${timeSlot}&location=${location}`)
    } else {
      res.redirect(`select-date-and-location`)
    }
  }
}

const amendFilters = (
  unlockFilters: UnlockFilters,
  clearFilters: string,
  clearLocation: string,
  clearActivity: string,
  clearStaying: string,
): UnlockFilters => {
  let newFilters
  if (clearFilters) {
    newFilters = defaultFilters(
      unlockFilters.location,
      unlockFilters.cellPrefix,
      unlockFilters.unlockDate,
      unlockFilters.formattedDate,
      unlockFilters.timeSlot,
      unlockFilters.subLocations,
    )
  } else if (clearLocation) {
    newFilters = clearLocationItem(unlockFilters, clearLocation)
  } else if (clearActivity) {
    newFilters = clearActivityItem(unlockFilters, clearActivity)
  } else if (clearStaying) {
    newFilters = clearStayingItem(unlockFilters, clearStaying)
  }
  return newFilters
}

const clearLocationItem = (unlockFilters: UnlockFilters, loc: string): UnlockFilters => {
  const newLocationFilters = unlockFilters.locationFilters.map(l => {
    return { value: l.value, text: l.text, checked: l.value === loc ? false : l.checked }
  })
  const newFilters = unlockFilters
  newFilters.locationFilters = newLocationFilters
  return newFilters
}

const clearActivityItem = (unlockFilters: UnlockFilters, act: string): UnlockFilters => {
  const newActivityFilters = unlockFilters.activityFilters.map(a => {
    return { value: a.value, text: a.text, checked: a.value === act ? false : a.checked }
  })
  const newFilters = unlockFilters
  newFilters.activityFilters = newActivityFilters
  return newFilters
}

const clearStayingItem = (unlockFilters: UnlockFilters, staying: string): UnlockFilters => {
  const newStayingOrLeavingFilters = unlockFilters.stayingOrLeavingFilters.map(s => {
    return { value: s.value, text: s.text, checked: s.value === staying ? false : s.checked }
  })
  const newFilters = unlockFilters
  newFilters.stayingOrLeavingFilters = newStayingOrLeavingFilters
  return newFilters
}

const parseFiltersFromPost = (
  oldFilters: UnlockFilters,
  locations: string | string[],
  activities: string | string[],
  stayingOrLeaving: string | string[],
): UnlockFilters => {
  const locationFilters = oldFilters.locationFilters.map(loc => {
    const checked = convertToArray(locations).includes(loc.value)
    return { value: loc.value, text: loc.text, checked } as UnlockFilterItem
  })

  const activityFilters = oldFilters.activityFilters.map(act => {
    const checked = convertToArray(activities).includes(act.value)
    return { value: act.value, text: act.text, checked } as UnlockFilterItem
  })

  const stayingOrLeavingFilters = oldFilters.stayingOrLeavingFilters.map(stay => {
    const checked = convertToArray(stayingOrLeaving).includes(stay.value)
    return { value: stay.value, text: stay.text, checked } as UnlockFilterItem
  })

  const newFilters = oldFilters

  // Only override filter values if something was provided in the POST body
  if (convertToArray(locations).length > 0) newFilters.activityFilters = activityFilters
  if (convertToArray(activities).length > 0) newFilters.locationFilters = locationFilters
  if (convertToArray(stayingOrLeaving).length > 0) newFilters.stayingOrLeavingFilters = stayingOrLeavingFilters

  return newFilters
}

const defaultFilters = (
  location: string,
  cellPrefix: string,
  unlockDate: string,
  formattedDate: string,
  timeSlot: string,
  subLocations: string[],
): UnlockFilters => {
  const locationFilters = subLocations.map(loc => {
    return { value: loc, text: loc, checked: true } as UnlockFilterItem
  })

  const activityFilters = [
    { value: 'Both', text: 'Both', checked: true },
    { value: 'With', text: 'With', checked: false },
    { value: 'Without', text: 'Without', checked: false },
  ] as UnlockFilterItem[]

  const stayingOrLeavingFilters = [
    { value: 'Both', text: 'Both', checked: true },
    { value: 'Staying', text: 'Staying', checked: false },
    { value: 'Leaving', text: 'Leaving', checked: false },
  ] as UnlockFilterItem[]

  return {
    location,
    cellPrefix,
    unlockDate,
    formattedDate,
    timeSlot,
    subLocations,
    locationFilters,
    activityFilters,
    stayingOrLeavingFilters,
  } as UnlockFilters
}
