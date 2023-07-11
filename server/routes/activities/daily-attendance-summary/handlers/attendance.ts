import { Request, Response } from 'express'
import { convertToArray, formatDate, toDate } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'
import { AttendanceSummaryFilters, FilterItem } from '../../../../@types/activities'
import PrisonService from '../../../../services/prisonService'
import AttendanceStatus from '../../../../enum/attendanceStatus'
import AttendanceReason from '../../../../enum/attendanceReason'
import { AllAttendance } from '../../../../@types/activitiesAPI/types'

export default class DailyAttendanceRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const activityDate = req.query.date ? toDate(req.query.date as string) : undefined
    if (activityDate === undefined) {
      return res.redirect('select-period')
    }
    let { status } = req.query
    status ??= ''

    let { attendanceSummaryFilters } = req.session

    let attendances: AllAttendance[]
    if (status === 'NotAttended') {
      attendances = (await this.activitiesService.getAllAttendance(activityDate, user)).filter(
        a => a.status === AttendanceStatus.WAITING,
      )
    } else if (status === 'Attended') {
      attendances = (await this.activitiesService.getAllAttendance(activityDate, user)).filter(
        a => a.attendanceReasonCode === AttendanceReason.ATTENDED,
      )
    } else if (status === 'Absences') {
      attendances = (await this.activitiesService.getAllAttendance(activityDate, user)).filter(
        a => a.status === AttendanceStatus.COMPLETED && a.attendanceReasonCode !== AttendanceReason.ATTENDED,
      )
    }

    const uniqueCategories = attendances.map(c => c.categoryName).filter((v, k, arr) => arr.indexOf(v) === k)
    const uniqueActivities = attendances.map(c => c.activitySummary).filter((v, k, arr) => arr.indexOf(v) === k)

    if (
      !attendanceSummaryFilters ||
      attendanceSummaryFilters.categoryFilters.length === 0 ||
      !attendanceSummaryFilters.activityFilters ||
      attendanceSummaryFilters.activityFilters.length === 0
    ) {
      attendanceSummaryFilters = defaultFilters(activityDate, '', uniqueCategories, uniqueActivities)
      req.session.attendanceSummaryFilters = attendanceSummaryFilters
    }
    const categoryFilters = attendanceSummaryFilters.categoryFilters
      .filter((category: FilterItem) => category.checked === true)
      .map((category: FilterItem) => category.value)

    const activityFilters = attendanceSummaryFilters.activityFilters
      .filter((activity: FilterItem) => activity.checked === true)
      .map((activity: FilterItem) => activity.value)

    const prisonerNumbers = attendances
      .filter(a => categoryFilters.includes(a.categoryName) && activityFilters.includes(a.activitySummary))
      .map(a => a.prisonerNumber)

    const inmates =
      prisonerNumbers?.length > 0 ? await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user) : []

    const unfilteredAttendees = attendances
      .filter(a => categoryFilters.includes(a.categoryName) && activityFilters.includes(a.activitySummary))
      .map(a => ({
        inmate: inmates.find(i => i.prisonerNumber === a.prisonerNumber),
        prisonerNumber: a.prisonerNumber,
        attendance: a,
      }))

    const filteredAttendees = unfilteredAttendees.map(a => ({
      name: `${a.inmate.firstName} ${a.inmate.lastName}`,
      prisonerNumber: a.prisonerNumber,
      location: a.inmate.cellLocation,
      attendance: a.attendance,
    }))

    const attendees = filteredAttendees.filter(
      a =>
        this.includesSearchTerm(a.name, attendanceSummaryFilters.searchTerm) ||
        this.includesSearchTerm(a.prisonerNumber, attendanceSummaryFilters.searchTerm),
    )

    if (status === 'NotAttended') {
      return res.render('pages/activities/daily-attendance-summary/not-attended', {
        activityDate,
        status,
        attendees,
        attendanceSummaryFilters,
      })
    }

    return res.render('pages/activities/daily-attendance-summary/attended', {
      activityDate,
      status,
      attendees,
      attendanceSummaryFilters,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { attendanceSummaryFilters } = req.session
    const activityDate = req.query.date ? toDate(req.query.date as string) : undefined
    const isoDateString = formatDate(new Date(activityDate), 'yyyy-MM-dd')
    const { status } = req.query
    attendanceSummaryFilters.searchTerm = req.body?.searchTerm ? (req.body?.searchTerm as string) : ''

    req.session.attendanceSummaryFilters = parseFiltersFromPost(
      attendanceSummaryFilters,
      req.body?.categoryFilters,
      req.body?.activityFilters,
    )
    res.redirect(`attendance?date=${isoDateString}&status=${status}`)
  }

  FILTERS = async (req: Request, res: Response): Promise<void> => {
    const { clearFilters, clearCategory } = req.query
    let { attendanceSummaryFilters } = req.session

    attendanceSummaryFilters = amendFilters(attendanceSummaryFilters, clearFilters as string, clearCategory as string)
    req.session.attendanceSummaryFilters = attendanceSummaryFilters

    // Reconstruct the query parameters from the amended filters
    const { activityDate } = attendanceSummaryFilters

    // Important - during serialization to/from session storage the date object is altered to a string
    const isoDateString = formatDate(new Date(activityDate), 'yyyy-MM-dd')

    res.redirect(`attendance?date=${isoDateString}`)
  }

  private includesSearchTerm = (propertyValue: string, searchTerm: string) =>
    !searchTerm || propertyValue.toLowerCase().includes(searchTerm.toLowerCase())
}

const defaultFilters = (
  activityDate: Date,
  searchTerm: string,
  categories: string[],
  activities: string[],
): AttendanceSummaryFilters => {
  const categoryFilters: FilterItem[] = []
  categories.forEach(category => categoryFilters.push({ value: category, text: category, checked: true }))
  const activityFilters: FilterItem[] = []
  activities.forEach(activity => activityFilters.push({ value: activity, text: activity, checked: true }))
  return {
    activityDate,
    searchTerm,
    categoryFilters,
    activityFilters,
  } as AttendanceSummaryFilters
}

const amendFilters = (
  attendanceSummaryFilters: AttendanceSummaryFilters,
  clearFilters: string,
  clearCategory: string,
): AttendanceSummaryFilters => {
  let newFilters = attendanceSummaryFilters
  if (clearFilters) {
    newFilters = defaultFilters(
      attendanceSummaryFilters.activityDate,
      attendanceSummaryFilters.searchTerm,
      attendanceSummaryFilters.categories,
      attendanceSummaryFilters.activities,
    )
  } else if (clearCategory) {
    newFilters = clearCategoryItem(attendanceSummaryFilters, clearCategory)
  }
  return newFilters
}

const clearCategoryItem = (
  attendanceSummaryFilters: AttendanceSummaryFilters,
  category: string,
): AttendanceSummaryFilters => {
  const newCategoryFilters = attendanceSummaryFilters.categoryFilters.map(c => {
    return { value: c.value, text: c.text, checked: c.value === category ? false : c.checked }
  })
  const newFilters = attendanceSummaryFilters
  newFilters.categoryFilters = newCategoryFilters
  return newFilters
}

const parseFiltersFromPost = (
  oldFilters: AttendanceSummaryFilters,
  categories: string[],
  activities: string[],
): AttendanceSummaryFilters => {
  const newFilters = oldFilters

  const categoryFilters = oldFilters.categoryFilters.map(category => {
    const checked = convertToArray(categories).includes(category.value)
    return { value: category.value, text: category.text, checked } as FilterItem
  })

  // Only override filter values if something was provided in the POST body
  if (convertToArray(categories).length > 0) newFilters.categoryFilters = categoryFilters

  const activityFilters = oldFilters.activityFilters.map(activity => {
    const checked = convertToArray(activities).includes(activity.value)
    return { value: activity.value, text: activity.text, checked } as FilterItem
  })

  // Only override filter values if something was provided in the POST body
  if (convertToArray(activities).length > 0) newFilters.activityFilters = activityFilters

  return newFilters
}
