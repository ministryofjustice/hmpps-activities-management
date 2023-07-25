import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'

export class Filters {
  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : undefined)) // Transform to an array if only one value is provided
  categoryFilters?: string[]

  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : undefined)) // Transform to an array if only one value is provided
  activityFilters?: string[]

  @Expose()
  searchTerm?: string
}

export default class ApplyFiltersRoutes {
  APPLY = async (req: Request, res: Response): Promise<void> => {
    const { categoryFilters, activityFilters, searchTerm } = req.body

    if (categoryFilters) {
      req.session.attendanceSummaryJourney.categoryFilters = categoryFilters
    }

    if (activityFilters) {
      req.session.attendanceSummaryJourney.activityFilters = activityFilters
    }

    if (searchTerm || searchTerm === '') {
      req.session.attendanceSummaryJourney.searchTerm = searchTerm
    }

    res.redirect('back')
  }
}
