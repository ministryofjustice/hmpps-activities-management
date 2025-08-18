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
      req.journeyData.unlockListJourney.subLocationFilters = locationFilters
    }

    if (activityCategoriesFilters) {
      req.journeyData.unlockListJourney.activityCategoriesFilters = activityCategoriesFilters
    }

    if (activityFilter) {
      req.journeyData.unlockListJourney.activityFilter = activityFilter
    }

    if (stayingOrLeavingFilter) {
      req.journeyData.unlockListJourney.stayingOrLeavingFilter = stayingOrLeavingFilter
    }

    if (cancelledEventsFilter) {
      req.journeyData.unlockListJourney.cancelledEventsFilter = cancelledEventsFilter
    }

    req.journeyData.unlockListJourney.alertFilters = alertFilters ?? []

    req.journeyData.unlockListJourney.searchTerm = asString(searchTerm)

    res.redirect(req.get('Referrer') || '/')
  }
}
