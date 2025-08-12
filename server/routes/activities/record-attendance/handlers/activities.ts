import { Request, Response } from 'express'
import { addDays, startOfDay } from 'date-fns'
import _ from 'lodash'
import ActivitiesService from '../../../../services/activitiesService'
import { asString, convertToArray, formatDate, toDate } from '../../../../utils/utils'
import PrisonService from '../../../../services/prisonService'
import { activityRows, filterItems } from '../utils/activitiesPageUtils'

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

    req.session.recordAttendanceJourney = {}

    const locations = await this.prisonService.getEventLocations(user.activeCaseLoadId, user)
    const uniqueLocations = _.uniqBy(locations, 'locationId')

    const activities = activityRows(
      activityDate,
      categories,
      activityAttendanceSummary,
      filterValues,
      asString(locationId),
      locationTypeFilter,
      asString(searchTerm),
    )

    return res.render('pages/activities/record-attendance/activities', {
      activityDate,
      filterItems: filterItems(categories, filterValues, asString(locationId), locationTypeFilter),
      selectedSessions: filterValues.sessionFilters,
      activityRows: activities,
      locations: uniqueLocations.filter(l => l.locationType !== 'BOX'),
      hasCancelledSessions: !!activities.find(a => a.cancelled),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { searchTerm, sessionFilters, categoryFilters, locationId, locationType } = req.body

    const activityDate = req.query.date ?? formatDate(new Date(), 'yyyy-MM-dd')
    const sessionFiltersString = sessionFilters ? convertToArray(sessionFilters).join(',') : ''
    const categoryFiltersString = categoryFilters ? convertToArray(categoryFilters).join(',') : ''

    const redirectUrl =
      `activities?date=${activityDate}` +
      `&searchTerm=${encodeURIComponent(searchTerm) ?? ''}` +
      `&sessionFilters=${sessionFiltersString}` +
      `&categoryFilters=${categoryFiltersString}` +
      `&locationId=${locationId ?? ''}` +
      `&locationType=${locationType ?? ''}`

    res.redirect(redirectUrl)
  }

  POST_ATTENDANCES = async (req: Request, res: Response): Promise<void> => {
    const { selectedInstanceIds, activityDate, sessionFilters } = req.body
    const selectedInstanceIdsArr = selectedInstanceIds ? convertToArray(selectedInstanceIds) : []
    req.session.recordAttendanceJourney = {
      selectedInstanceIds: selectedInstanceIdsArr,
      activityDate,
      sessionFilters,
    }
    if (selectedInstanceIdsArr.length === 1) {
      return res.redirect(`${selectedInstanceIdsArr[0]}/attendance-list`)
    }
    return res.redirect('attendance-list')
  }

  POST_CANCELLATIONS = async (req: Request, res: Response): Promise<void> => {
    const { selectedInstanceIds, activityDate, sessionFilters } = req.body
    const selectedInstanceIdsArr = selectedInstanceIds ? convertToArray(selectedInstanceIds) : []
    req.session.recordAttendanceJourney = {
      selectedInstanceIds: selectedInstanceIdsArr,
      activityDate,
      sessionFilters,
    }

    if (selectedInstanceIdsArr.length === 1) {
      return res.redirect('cancel-single/cancel-reason')
    }

    return res.redirect('cancel-multiple/cancel-reason')
  }
}
