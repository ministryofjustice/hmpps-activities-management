import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { asString } from '../../../../utils/utils'

export class Filters {
  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : undefined)) // Transform to an array if only one value is provided
  locationFilters?: string[]

  @Expose()
  activityFilter?: string

  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : undefined)) // Transform to an array if only one value is provided
  activityCategoriesFilters?: string[]

  @Expose()
  stayingOrLeavingFilter?: string

  @Expose()
  cancelledEventsFilter?: string

  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : undefined)) // Transform to an array if only one value is provided
  alertFilters?: string[]
}

export default class ApplyFiltersRoutes {
  APPLY = async (req: Request, res: Response): Promise<void> => {
    const {
      locationFilters,
      activityFilter,
      activityCategoriesFilters,
      stayingOrLeavingFilter,
      alertFilters,
      searchTerm,
      cancelledEventsFilter,
    } = req.body

    if (locationFilters) {
      req.session.unlockListJourney.subLocationFilters = locationFilters
    }

    if (activityCategoriesFilters) {
      req.session.unlockListJourney.activityCategoriesFilters = activityCategoriesFilters
    }

    if (activityFilter) {
      req.session.unlockListJourney.activityFilter = activityFilter
    }

    if (stayingOrLeavingFilter) {
      req.session.unlockListJourney.stayingOrLeavingFilter = stayingOrLeavingFilter
    }

    if (cancelledEventsFilter) {
      req.session.unlockListJourney.cancelledEventsFilter = cancelledEventsFilter
    }

    req.session.unlockListJourney.alertFilters = alertFilters ?? []

    req.session.unlockListJourney.searchTerm = asString(searchTerm)

    res.redirect('back')
  }
}
