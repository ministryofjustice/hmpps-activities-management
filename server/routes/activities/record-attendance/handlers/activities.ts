import { Request, Response } from 'express'
import { addDays, startOfDay } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import { asString, convertToArray, formatDate, getTimeSlotFromTime, toDate } from '../../../../utils/utils'
import { ActivityCategory } from '../../../../@types/activitiesAPI/types'
import TimeSlot from '../../../../enum/timeSlot'

export default class ActivitiesRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { date, searchTerm, sessionFilters, categoryFilters, locationFilters } = req.query

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

    const selectedCategoryIds = categories
      .filter(c => filterValues.categoryFilters?.includes(c.code) ?? true)
      .map(c => c.id)

    const filteredActivities = activityAttendanceSummary
      .filter(a => (searchTerm ? a.summary.toLowerCase().includes(asString(searchTerm).toLowerCase()) : true))
      .filter(a => filterValues.sessionFilters?.includes(getTimeSlotFromTime(a.startTime)) ?? true)
      .filter(a => selectedCategoryIds?.includes(a.categoryId) ?? true)
      .filter(a => filterValues.locationFilters?.includes(a.inCell ? 'IN_CELL' : 'OUT_OF_CELL') ?? true)

    const activitiesBySession = {
      am: filteredActivities.filter(a => getTimeSlotFromTime(a.startTime) === TimeSlot.AM),
      pm: filteredActivities.filter(a => getTimeSlotFromTime(a.startTime) === TimeSlot.PM),
      ed: filteredActivities.filter(a => getTimeSlotFromTime(a.startTime) === TimeSlot.ED),
    }

    return res.render('pages/activities/record-attendance/activities', {
      activitiesBySession,
      activityDate,
      filterItems: filterItems(categories, filterValues),
      selectedSessions: filterValues.sessionFilters,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { searchTerm, sessionFilters, categoryFilters, locationFilters } = req.body

    const activityDate = req.query.date ?? formatDate(new Date(), 'YYYY-MM-dd')
    const sessionFiltersString = sessionFilters ? convertToArray(sessionFilters).join(',') : ''
    const categoryFiltersString = categoryFilters ? convertToArray(categoryFilters).join(',') : ''
    const locationFiltersString = locationFilters ? convertToArray(locationFilters).join(',') : ''

    const redirectUrl =
      `activities?date=${activityDate}&searchTerm=${searchTerm ?? ''}` +
      `&sessionFilters=${sessionFiltersString}` +
      `&categoryFilters=${categoryFiltersString}` +
      `&locationFilters=${locationFiltersString}`
    res.redirect(redirectUrl)
  }
}

const filterItems = (categories: ActivityCategory[], filterValues: { [key: string]: string[] }) => {
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
  const locationFilters = [
    { value: 'IN_CELL', text: 'In cell' },
    { value: 'OUT_OF_CELL', text: 'Out of cell' },
  ].map(c => ({ ...c, checked: filterValues.locationFilters?.includes(c.value) ?? true }))

  return { sessionFilters, categoryFilters, locationFilters }
}
