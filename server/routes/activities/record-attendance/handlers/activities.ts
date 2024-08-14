import { Request, Response } from 'express'
import { addDays, startOfDay } from 'date-fns'
import _ from 'lodash'
import ActivitiesService from '../../../../services/activitiesService'
import { asString, convertToArray, formatDate, toDate } from '../../../../utils/utils'
import { ActivityCategory } from '../../../../@types/activitiesAPI/types'
import TimeSlot from '../../../../enum/timeSlot'
import { AttendActivityMode } from '../recordAttendanceRequests'
import PrisonService from '../../../../services/prisonService'
import { LocationType } from '../../create-an-activity/handlers/location'

export default class ActivitiesRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { date, searchTerm, sessionFilters, categoryFilters, locationId, locationType } = req.query

    const activityDate = date ? toDate(asString(date)) : new Date()

    if (startOfDay(activityDate) > startOfDay(addDays(new Date(), 60))) return res.redirect('select-period')

    const [categories, activityAttendanceSummary] = await Promise.all([
      this.activitiesService.getActivityCategories(user),
      this.activitiesService.getScheduledInstanceAttendanceSummary(user.activeCaseLoadId, activityDate, user),
    ])

    const filterValues = {
      sessionFilters: sessionFilters !== undefined ? asString(sessionFilters).split(',') : null,
      categoryFilters: categoryFilters !== undefined ? asString(categoryFilters).split(',') : null,
    }

    const locationTypeFilter = locationType !== undefined ? asString(locationType) : 'ALL'

    const selectedCategoryIds = categories
      .filter(c => filterValues.categoryFilters?.includes(c.code) ?? true)
      .map(c => c.id)

    const filteredActivities = activityAttendanceSummary
      .filter(a => (searchTerm ? a.summary.toLowerCase().includes(asString(searchTerm).toLowerCase()) : true))
      .filter(a => filterValues.sessionFilters?.includes(a.timeSlot) ?? true)
      .filter(a => selectedCategoryIds?.includes(a.categoryId) ?? true)
      .filter(a => {
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
      })

    const activityRows = filteredActivities
      .map(a => {
        const session = TimeSlot[a.timeSlot]
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

  POST = async (req: Request, res: Response): Promise<void> => {
    const { searchTerm, sessionFilters, categoryFilters, locationId, locationType } = req.body

    const activityDate = req.query.date ?? formatDate(new Date(), 'YYYY-MM-dd')
    const sessionFiltersString = sessionFilters ? convertToArray(sessionFilters).join(',') : ''
    const categoryFiltersString = categoryFilters ? convertToArray(categoryFilters).join(',') : ''

    const redirectUrl =
      `activities?date=${activityDate}&searchTerm=${searchTerm ?? ''}` +
      `&sessionFilters=${sessionFiltersString}` +
      `&categoryFilters=${categoryFiltersString}` +
      `&locationId=${locationId ?? ''}` +
      `&locationType=${locationType ?? ''}`

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
    { value: 'AM', text: 'Morning (AM)' },
    { value: 'PM', text: 'Afternoon (PM)' },
    { value: 'ED', text: 'Evening (ED)' },
  ].map(c => ({ ...c, checked: filterValues.sessionFilters?.includes(c.value) ?? true }))

  return {
    sessionFilters,
    categoryFilters,
    locationType,
    locationId: locationType === LocationType.OUT_OF_CELL ? locationId : null,
  }
}
