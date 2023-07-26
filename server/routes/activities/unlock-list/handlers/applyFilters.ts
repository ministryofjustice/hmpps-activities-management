import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'

export class Filters {
  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : undefined)) // Transform to an array if only one value is provided
  locationFilters?: string[]

  @Expose()
  activityFilter?: string

  @Expose()
  stayingOrLeavingFilter?: string
}

export default class ApplyFiltersRoutes {
  APPLY = async (req: Request, res: Response): Promise<void> => {
    const { locationFilters, activityFilter, stayingOrLeavingFilter } = req.body

    if (locationFilters) {
      req.session.unlockListJourney.subLocationFilters = locationFilters
    }

    if (activityFilter) {
      req.session.unlockListJourney.activityFilter = activityFilter
    }

    if (stayingOrLeavingFilter) {
      req.session.unlockListJourney.stayingOrLeavingFilter = stayingOrLeavingFilter
    }

    res.redirect('back')
  }
}
