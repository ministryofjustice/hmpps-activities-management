import { Request, Response } from 'express'
import { addDays, startOfDay } from 'date-fns'
import _ from 'lodash'
import ActivitiesService from '../../../../services/activitiesService'
import { asString, convertToArray, formatDate, getTimeSlotFromTime, toDate } from '../../../../utils/utils'
import { ActivityCategory } from '../../../../@types/activitiesAPI/types'
import TimeSlot from '../../../../enum/timeSlot'
import { AttendActivityMode } from '../recordAttendanceRequests'
import PrisonService from '../../../../services/prisonService'
import { LocationType } from '../../create-an-activity/handlers/location'
import config from '../../../../config'

export default class ActivitiesRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    // TODO: SAA-1796 Remove locationFilters
    const { date, searchTerm, sessionFilters, categoryFilters, locationFilters, locationId, locationType } = req.query

    const activityDate = date ? toDate(asString(date)) : new Date()

    if (startOfDay(activityDate) > startOfDay(addDays(new Date(), 60))) return res.redirect('select-period')

    const [categories, activityAttendanceSummary] = await Promise.all([
      this.activitiesService.getActivityCategories(user),
      this.activitiesService.getScheduledInstanceAttendanceSummary(user.activeCaseLoadId, activityDate, user),
    ])

    const filterValues = {
      sessionFilters: sessionFilters !== undefined ? asString(sessionFilters).split(',') : null,
      categoryFilters: categoryFilters !== undefined ? asString(categoryFilters).split(',') : null,
      locationFilters: locationFilters !== undefined ? asString(locationFilters).split(',') : null,
    }

    const locationTypeFilter = locationType !== undefined ? asString(locationType) : 'ALL'

    const selectedCategoryIds = categories
      .filter(c => filterValues.categoryFilters?.includes(c.code) ?? true)
      .map(c => c.id)

    const filteredActivities = activityAttendanceSummary
      .filter(a => (searchTerm ? a.summary.toLowerCase().includes(asString(searchTerm).toLowerCase()) : true))
      .filter(a => filterValues.sessionFilters?.includes(getTimeSlotFromTime(a.startTime)) ?? true)
      .filter(a => selectedCategoryIds?.includes(a.categoryId) ?? true)
      .filter(a => {
        if (config.recordAttendanceSelectSlotFirst) {
          switch (locationTypeFilter) {
            case LocationType.OUT_OF_CELL:
              return a.internalLocation?.id === +asString(locationId)
            case LocationType.IN_CELL:
              return a.inCell
            case LocationType.ON_WING:
              return a.onWing
            case LocationType.OFF_WING:
              return a.offWing
            default:
              return true
          }
        } else {
          return filterValues.locationFilters?.includes(a.inCell ? 'IN_CELL' : 'OUT_OF_CELL') ?? true
        }
      })

    const activityRows = filteredActivities
      .map(a => {
        const session = getTimeSlotFromTime(a.startTime)
        return {
          ...a,
          session,
          sessionOrderIndex: Object.values(TimeSlot).indexOf(session),
        }
      })
      .filter(a => !filterValues.sessionFilters || filterValues.sessionFilters.includes(a.session))
      .sort((a, b) => {
        return a.sessionOrderIndex - b.sessionOrderIndex
      })

    req.session.recordAttendanceRequests = {}

    if (config.recordAttendanceSelectSlotFirst) {
      const locations = await this.prisonService.getEventLocations(user.activeCaseLoadId, user)
      const uniqueLocations = _.uniqBy(locations, 'locationId')

      return res.render('pages/activities/record-attendance/activities', {
        activityDate,
        filterItems: filterItems(categories, filterValues, asString(locationId), locationTypeFilter),
        selectedSessions: filterValues.sessionFilters,
        activityRows,
        locations: uniqueLocations.filter(l => l.locationType !== 'BOX'),
      })
    }
    const activitiesBySession = {
      am: filteredActivities.filter(a => getTimeSlotFromTime(a.startTime) === TimeSlot.AM),
      pm: filteredActivities.filter(a => getTimeSlotFromTime(a.startTime) === TimeSlot.PM),
      ed: filteredActivities.filter(a => getTimeSlotFromTime(a.startTime) === TimeSlot.ED),
    }

    return res.render('pages/activities/record-attendance/activities', {
      activitiesBySession,
      activityDate,
      filterItems: filterItems(categories, filterValues, asString(locationId), locationTypeFilter),
      selectedSessions: filterValues.sessionFilters,
      activityRows,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    // TODO: SAA-1796 Remove locationFilters
    const { searchTerm, sessionFilters, categoryFilters, locationFilters, locationId, locationType } = req.body

    const activityDate = req.query.date ?? formatDate(new Date(), 'YYYY-MM-dd')
    const sessionFiltersString = sessionFilters ? convertToArray(sessionFilters).join(',') : ''
    const categoryFiltersString = categoryFilters ? convertToArray(categoryFilters).join(',') : ''

    let redirectUrl: string

    if (config.recordAttendanceSelectSlotFirst) {
      redirectUrl =
        `activities?date=${activityDate}&searchTerm=${searchTerm ?? ''}` +
        `&sessionFilters=${sessionFiltersString}` +
        `&categoryFilters=${categoryFiltersString}` +
        `&locationId=${locationId ?? ''}` +
        `&locationType=${locationType ?? ''}`
    } else {
      const locationFiltersString = locationFilters ? convertToArray(locationFilters).join(',') : ''

      redirectUrl =
        `activities?date=${activityDate}&searchTerm=${searchTerm ?? ''}` +
        `&sessionFilters=${sessionFiltersString}` +
        `&categoryFilters=${categoryFiltersString}` +
        `&locationFilters=${locationFiltersString}`
    }
    res.redirect(redirectUrl)
  }

  POST_ATTENDANCES = async (req: Request, res: Response): Promise<void> => {
    const { selectedInstanceIds, activityDate, sessionFilters } = req.body
    const selectedInstanceIdsArr = selectedInstanceIds ? convertToArray(selectedInstanceIds) : []
    req.session.recordAttendanceRequests = {
      mode: AttendActivityMode.MULTIPLE,
      selectedInstanceIds: selectedInstanceIdsArr,
      activityDate,
      sessionFilters,
    }
    if (selectedInstanceIdsArr.length === 1) {
      return res.redirect(`/activities/attendance/activities/${selectedInstanceIdsArr[0]}/attendance-list`)
    }
    return res.redirect('/activities/attendance/activities/attendance-list')
  }
}

const filterItems = (
  categories: ActivityCategory[],
  filterValues: { [key: string]: string[] },
  locationId: string,
  locationType: string,
) => {
  const categoryFilters = categories.map(category => ({
    value: category.code,
    text: category.name,
    checked: filterValues.categoryFilters?.includes(category.code) ?? true,
  }))
  const sessionFilters = [
    { value: 'am', text: 'Morning (AM)' },
    { value: 'pm', text: 'Afternoon (PM)' },
    { value: 'ed', text: 'Evening (ED)' },
  ].map(c => ({ ...c, checked: filterValues.sessionFilters?.includes(c.value) ?? true }))
  // TODO: SAA-1795: Remove locationFilters
  const locationFilters = [
    { value: 'IN_CELL', text: 'In cell' },
    { value: 'OUT_OF_CELL', text: 'Out of cell' },
  ].map(c => ({ ...c, checked: filterValues.locationFilters?.includes(c.value) ?? true }))

  if (!config.recordAttendanceSelectSlotFirst) {
    return {
      sessionFilters,
      categoryFilters,
      locationFilters,
    }
  }
  return {
    sessionFilters,
    categoryFilters,
    locationType,
    locationId: locationType === LocationType.OUT_OF_CELL ? locationId : null,
  }
}
