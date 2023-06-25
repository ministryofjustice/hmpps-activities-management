import { Request, Response } from 'express'
import _ from 'lodash'
import ActivitiesService from '../../../../services/activitiesService'
import { convertToArray, formatDate, getAttendanceSummary, getTimeSlotFromTime, toDate } from '../../../../utils/utils'
import { FilterItem, ActivitiesFilters } from '../../../../@types/activities'
import { ActivityCategory } from '../../../../@types/activitiesAPI/types'

export default class ActivitiesRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const activityDate = req.query.date ? toDate(req.query.date as string) : undefined
    let { activitiesFilters } = req.session

    if (!activitiesFilters) {
      const [categories] = await Promise.all([this.activitiesService.getActivityCategories(user)])
      activitiesFilters = defaultFilters(activityDate, '', categories)
      req.session.activitiesFilters = activitiesFilters
    }

    if (activityDate === undefined) {
      return res.redirect('select-period')
    }

    const sessionFilters = activitiesFilters.sessionFilters
      .filter(session => session.checked)
      .map(session => session.value)

    const categoryFilters = activitiesFilters.categoryFilters
      .filter(category => category.checked)
      .map(category => category.value)

    const locationFilters = activitiesFilters.locationFilters
      .filter(location => location.checked)
      .map(location => location.value)

    const activitiesModel = await this.activitiesService
      .getScheduledActivitiesAtPrison(activityDate, user)
      .then(scheduledActivities =>
        scheduledActivities.map(activity => ({
          id: activity.id,
          name: activity.activitySchedule.activity.summary,
          scheduleName: activity.activitySchedule.description,
          category: activity.activitySchedule.activity.category.code,
          location: activity.activitySchedule.internalLocation?.description,
          inCell: activity.activitySchedule.activity.inCell,
          timeSlot: getTimeSlotFromTime(activity.startTime),
          time: `${activity.startTime} - ${activity.endTime}`,
          cancelled: activity.cancelled,
          ...getAttendanceSummary(activity.attendances),
        })),
      )
      .then(scheduledActivities =>
        scheduledActivities.filter(a => this.nameIncludesSearchTerm(a.name, activitiesFilters.searchTerm)),
      )
      .then(scheduledActivities =>
        scheduledActivities.filter(a => sessionFilters.includes(a.timeSlot.toUpperCase()) === true),
      )
      .then(scheduledActivities => scheduledActivities.filter(a => categoryFilters.includes(a.category)))
      .then(scheduledActivities =>
        scheduledActivities.filter(a => locationFilters.includes(a.inCell ? 'IN_CELL' : 'OUT_OF_CELL')),
      )
      .then(scheduledActivities => ({
        ..._.groupBy(scheduledActivities, 'timeSlot'),
        ...{ length: scheduledActivities.length },
      }))

    return res.render('pages/activities/record-attendance/activities', {
      activities: activitiesModel,
      activityDate,
      activitiesFilters,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { activitiesFilters } = req.session
    const activityDate = req.query.date ? toDate(req.query.date as string) : undefined
    activitiesFilters.searchTerm = req.body?.searchTerm ? (req.body?.searchTerm as string) : ''
    const isoDateString = formatDate(new Date(activityDate), 'yyyy-MM-dd')

    req.session.activitiesFilters = parseFiltersFromPost(
      activitiesFilters,
      req.body?.sessionFilters,
      req.body?.categoryFilters,
      req.body?.locationFilters,
    )
    res.redirect(`activities?date=${isoDateString}`)
  }

  FILTERS = async (req: Request, res: Response): Promise<void> => {
    const { clearFilters, clearSession, clearCategory } = req.query
    let { activitiesFilters } = req.session

    activitiesFilters = amendFilters(
      activitiesFilters,
      clearFilters as string,
      clearSession as string,
      clearCategory as string,
    )
    req.session.activitiesFilters = activitiesFilters

    // Reconstruct the query parameters from the amended filters
    const { activityDate } = activitiesFilters

    // Important - during serialization to/from session storage the date object is altered to a string
    const isoDateString = formatDate(new Date(activityDate), 'yyyy-MM-dd')

    res.redirect(`activities?date=${isoDateString}`)
  }

  private nameIncludesSearchTerm = (name: string, searchTerm: string) =>
    !searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase())
}

const defaultFilters = (activityDate: Date, searchTerm: string, categories: ActivityCategory[]): ActivitiesFilters => {
  const categoryFilters: FilterItem[] = categories.map(category => ({
    value: category.code,
    text: category.name,
    checked: true,
  }))
  const sessionFilters = [
    { value: 'AM', text: 'Morning (AM)', checked: true },
    { value: 'PM', text: 'Afternoon (PM)', checked: true },
    { value: 'ED', text: 'Evening (ED)', checked: true },
  ] as FilterItem[]
  const locationFilters: FilterItem[] = [
    { value: 'IN_CELL', text: 'In cell', checked: true },
    { value: 'OUT_OF_CELL', text: 'Out of cell', checked: true },
  ]
  return {
    activityDate,
    searchTerm,
    sessionFilters,
    categoryFilters,
    locationFilters,
  } as ActivitiesFilters
}

const amendFilters = (
  activitiesFilters: ActivitiesFilters,
  clearFilters: string,
  clearSession: string,
  clearCategory: string,
): ActivitiesFilters => {
  let newFilters = activitiesFilters
  if (clearFilters) {
    newFilters = defaultFilters(
      activitiesFilters.activityDate,
      activitiesFilters.searchTerm,
      activitiesFilters.categories,
    )
  } else if (clearSession) {
    newFilters = clearSessionItem(activitiesFilters, clearSession)
  } else if (clearCategory) {
    newFilters = clearCategoryItem(activitiesFilters, clearCategory)
  }
  return newFilters
}

const clearSessionItem = (activitiesFilters: ActivitiesFilters, session: string): ActivitiesFilters => {
  const newSessionFilters = activitiesFilters.sessionFilters.map(s => {
    return { value: s.value, text: s.text, checked: s.value === session ? false : s.checked }
  })
  const newFilters = activitiesFilters
  newFilters.sessionFilters = newSessionFilters
  return newFilters
}

const clearCategoryItem = (activitiesFilters: ActivitiesFilters, category: string): ActivitiesFilters => {
  const newCategoryFilters = activitiesFilters.categoryFilters.map(c => {
    return { value: c.value, text: c.text, checked: c.value === category ? false : c.checked }
  })
  const newFilters = activitiesFilters
  newFilters.categoryFilters = newCategoryFilters
  return newFilters
}

const parseFiltersFromPost = (
  oldFilters: ActivitiesFilters,
  sessions: string | string[],
  categories: string | string[],
  locations: string | string[],
): ActivitiesFilters => {
  const newFilters = oldFilters

  newFilters.sessionFilters = oldFilters.sessionFilters.map(session => {
    const checked = convertToArray(sessions).includes(session.value)
    return { value: session.value, text: session.text, checked } as FilterItem
  })

  newFilters.categoryFilters = oldFilters.categoryFilters.map(category => {
    const checked = convertToArray(categories).includes(category.value)
    return { value: category.value, text: category.text, checked } as FilterItem
  })

  newFilters.locationFilters = oldFilters.locationFilters.map(location => {
    const checked = convertToArray(locations).includes(location.value)
    return { value: location.value, text: location.text, checked } as FilterItem
  })

  return newFilters
}
