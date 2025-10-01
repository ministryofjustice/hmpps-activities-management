import { Request, Response } from 'express'
import { addDays, formatDate, startOfDay, toDate } from 'date-fns'
import _ from 'lodash'
import { asString, convertToArray } from '../../../../../utils/utils'
import { activityRows, filterItems } from '../../utils/activitiesPageUtils'
import LocationsService from '../../../../../services/locationsService'
import ActivitiesService from '../../../../../services/activitiesService'

export default class ListActivitiesRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly locationsService: LocationsService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { date, sessionFilters, categoryFilters, locationId, locationType } = req.query

    const activityDate = date ? toDate(asString(date)) : new Date()
    if (startOfDay(activityDate) > startOfDay(addDays(new Date(), 60))) return res.redirect('select-period')

    const selectedLocation = locationId ? await this.locationsService.getLocationById(asString(locationId), user) : null

    const [categories, activityAttendanceSummary] = await Promise.all([
      this.activitiesService.getActivityCategories(user),
      this.activitiesService.getScheduledInstanceAttendanceSummary(user.activeCaseLoadId, activityDate, user),
    ])

    const filterValues = {
      sessionFilters: sessionFilters !== undefined ? asString(sessionFilters).split(',') : null,
      categoryFilters: categoryFilters !== undefined ? asString(categoryFilters).split(',') : null,
    }

    const locationTypeFilter = locationType !== undefined ? asString(locationType) : 'ALL'

    req.journeyData.recordAttendanceJourney = {}

    const locations = await this.locationsService.fetchNonResidentialActivityLocations(user.activeCaseLoadId, user)
    const uniqueLocations = _.uniqBy(locations, 'id')

    const activities = activityRows(
      activityDate,
      categories,
      activityAttendanceSummary,
      filterValues,
      asString(locationId),
      locationTypeFilter,
      '',
    )

    const activitiesLocationList = activities.map(a => a.internalLocation?.code)

    return res.render('pages/activities/record-attendance/attend-all/list-activities', {
      selectedLocation,
      activityDate,
      filterItems: filterItems(categories, filterValues, asString(locationId), locationTypeFilter),
      selectedSessions: filterValues.sessionFilters,
      activityRows: activities,
      locations: uniqueLocations
        .filter(l => l.locationType !== 'BOX')
        .filter(l => activitiesLocationList.includes(l.code)),
      hasCancelledSessions: !!activities.find(a => a.cancelled),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { sessionFilters, categoryFilters, locationId, locationType } = req.body

    const activityDate = req.query.date ?? formatDate(new Date(), 'yyyy-MM-dd')
    const sessionFiltersString = sessionFilters ? convertToArray(sessionFilters).join(',') : ''
    const categoryFiltersString = categoryFilters ? convertToArray(categoryFilters).join(',') : ''

    const redirectUrl =
      `list-activities?date=${activityDate}` +
      `&sessionFilters=${sessionFiltersString}` +
      `&categoryFilters=${categoryFiltersString}` +
      `&locationId=${locationId ?? ''}` +
      `&locationType=${locationType ?? ''}`

    res.redirect(redirectUrl)
  }
}
