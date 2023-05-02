import { Request, Response } from 'express'
import { convertToArray, formatDate, getDailyAttendanceSummary, toDate } from '../../../utils/utils'
import ActivitiesService from '../../../services/activitiesService'
import { AttendanceSummaryFilters, FilterItem } from '../../../@types/activities'

export default class DailySummaryRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const activityDate = req.query.date ? toDate(req.query.date as string) : undefined
    if (activityDate === undefined) {
      return res.redirect('select-period')
    }

    let { attendanceSummaryFilters } = req.session

    const attendanceSummary = await this.activitiesService.getAllAttendanceSummary(activityDate, user)
    const uniqueCategories = attendanceSummary.map(c => c.categoryName).filter((v, k, arr) => arr.indexOf(v) === k)

    if (!attendanceSummaryFilters) {
      attendanceSummaryFilters = defaultFilters(activityDate, uniqueCategories)
      req.session.attendanceSummaryFilters = attendanceSummaryFilters
    }

    const categoryFilters = attendanceSummaryFilters.categoryFilters
      .filter((category: FilterItem) => category.checked === true)
      .map((category: FilterItem) => category.value)

    return res.render('pages/daily-attendance-summary/daily-summary', {
      activityDate,
      ...getDailyAttendanceSummary(
        attendanceSummary.filter(a => categoryFilters.includes(a.categoryName) || categoryFilters.includes('ALL')),
      ),
      attendanceSummaryFilters,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { attendanceSummaryFilters } = req.session
    const activityDate = req.query.date ? toDate(req.query.date as string) : undefined
    const isoDateString = formatDate(new Date(activityDate), 'yyyy-MM-dd')

    req.session.attendanceSummaryFilters = parseFiltersFromPost(
      attendanceSummaryFilters,
      req.body?.categoryFilters ? req.body?.categoryFilters : undefined,
    )
    res.redirect(`summary?date=${isoDateString}`)
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

    res.redirect(`summary?date=${isoDateString}`)
  }
}

const defaultFilters = (activityDate: Date, categories: string[]): AttendanceSummaryFilters => {
  const categoryFilters: FilterItem[] = [{ value: 'ALL', text: 'All Categories', checked: true }]
  categories.forEach(category => categoryFilters.push({ value: category, text: category, checked: false }))
  return {
    activityDate,
    categoryFilters,
  } as AttendanceSummaryFilters
}

const amendFilters = (
  attendanceSummaryFilters: AttendanceSummaryFilters,
  clearFilters: string,
  clearCategory: string,
): AttendanceSummaryFilters => {
  let newFilters = attendanceSummaryFilters
  if (clearFilters) {
    newFilters = defaultFilters(attendanceSummaryFilters.activityDate, attendanceSummaryFilters.categories)
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
  categories: string | string[],
): AttendanceSummaryFilters => {
  const newFilters = oldFilters

  const categoryFilters = oldFilters.categoryFilters.map(category => {
    const checked = convertToArray(categories).includes(category.value)
    return { value: category.value, text: category.text, checked } as FilterItem
  })

  // Only override filter values if something was provided in the POST body
  if (convertToArray(categories).length > 0) newFilters.categoryFilters = categoryFilters

  return newFilters
}
