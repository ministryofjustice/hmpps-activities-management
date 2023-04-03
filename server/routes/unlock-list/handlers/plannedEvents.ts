import { Request, Response } from 'express'
import { FilterItem, UnlockFilters } from '../../../@types/activities'
import ActivitiesService from '../../../services/activitiesService'
import UnlockListService from '../../../services/unlockListService'
import { toDate, convertToArray, formatDate } from '../../../utils/utils'

export default class PlannedEventsRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly unlockListService: UnlockListService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { date, slot, location } = req.query
    const unlockDate = toDate(date as string)
    const locationName: string = (location as string) || undefined
    let { unlockFilters } = req.session

    if (!unlockFilters) {
      const prefix = await this.activitiesService.getLocationPrefix(locationName, user)
      const locationsAtPrison = await this.activitiesService.getLocationGroups(user)
      const subLocations = locationsAtPrison.filter(loc => loc.name === locationName)[0].children.map(loc => loc.name)
      unlockFilters = defaultFilters(locationName, prefix.locationPrefix, unlockDate, slot as string, subLocations)
      req.session.unlockFilters = unlockFilters
    } else {
      // Important - during serialization to/from session storage the date object is altered to a string
      unlockFilters.unlockDate = new Date(unlockFilters.unlockDate)
    }

    const unlockListItems = await this.unlockListService.getFilteredUnlockList(unlockFilters, user)

    res.render('pages/unlock-list/planned-events', { unlockFilters, unlockListItems })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
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
      req.session.unlockFilters = unlockFilters

      // Reconstruct the query parameters from the amended filters
      const { unlockDate, timeSlot, location } = unlockFilters

      // Important - during serialization to/from session storage the date object is altered to a string
      const isoDateString = formatDate(new Date(unlockDate), 'yyyy-MM-dd')

      res.redirect(`planned-events?date=${isoDateString}&slot=${timeSlot}&location=${location}`)
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
  let newFilters = unlockFilters
  if (clearFilters) {
    newFilters = defaultFilters(
      unlockFilters.location,
      unlockFilters.cellPrefix,
      unlockFilters.unlockDate,
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
  const newActivityFilters = unlockFilters.activityFilters
    .map(a => ({
      value: a.value,
      text: a.text,
      checked: a.value === act ? false : a.checked,
    }))
    .map(a => ({
      value: a.value,
      text: a.text,
      checked: a.value === 'Both' ? true : a.checked,
    }))
  const newFilters = unlockFilters
  newFilters.activityFilters = newActivityFilters
  return newFilters
}

const clearStayingItem = (unlockFilters: UnlockFilters, staying: string): UnlockFilters => {
  const newStayingOrLeavingFilters = unlockFilters.stayingOrLeavingFilters
    .map(s => ({
      value: s.value,
      text: s.text,
      checked: s.value === staying ? false : s.checked,
    }))
    .map(a => ({
      value: a.value,
      text: a.text,
      checked: a.value === 'Both' ? true : a.checked,
    }))
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
  const newFilters = oldFilters

  const locationFilters = oldFilters.locationFilters.map(loc => {
    const checked = convertToArray(locations).includes(loc.value)
    return { value: loc.value, text: loc.text, checked } as FilterItem
  })

  const activityFilters = oldFilters.activityFilters.map(act => {
    const checked = convertToArray(activities).includes(act.value)
    return { value: act.value, text: act.text, checked } as FilterItem
  })

  const stayingOrLeavingFilters = oldFilters.stayingOrLeavingFilters.map(stay => {
    const checked = convertToArray(stayingOrLeaving).includes(stay.value)
    return { value: stay.value, text: stay.text, checked } as FilterItem
  })

  // Only override filter values if something was provided in the POST body
  if (convertToArray(locations).length > 0) newFilters.activityFilters = activityFilters
  if (convertToArray(activities).length > 0) newFilters.locationFilters = locationFilters
  if (convertToArray(stayingOrLeaving).length > 0) newFilters.stayingOrLeavingFilters = stayingOrLeavingFilters

  return newFilters
}

const defaultFilters = (
  location: string,
  cellPrefix: string,
  unlockDate: Date,
  timeSlot: string,
  subLocations: string[],
): UnlockFilters => {
  const locationFilters = subLocations.map(loc => {
    return { value: loc, text: loc, checked: true } as FilterItem
  })

  const activityFilters = [
    { value: 'Both', text: 'Both', checked: true },
    { value: 'With', text: 'With', checked: false },
    { value: 'Without', text: 'Without', checked: false },
  ] as FilterItem[]

  const stayingOrLeavingFilters = [
    { value: 'Both', text: 'Both', checked: true },
    { value: 'Staying', text: 'Staying', checked: false },
    { value: 'Leaving', text: 'Leaving', checked: false },
  ] as FilterItem[]

  return {
    location,
    cellPrefix,
    unlockDate,
    timeSlot,
    subLocations,
    locationFilters,
    activityFilters,
    stayingOrLeavingFilters,
  } as UnlockFilters
}
