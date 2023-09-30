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
  @Transform(({ value }) =>
    value
      ? [value]
          .flat()
          .map(v => v.trim())
          .find(v => v !== '')
      : undefined,
  )
  searchTerm?: string
}

export default class ApplyFiltersRoutes {
  APPLY = async (req: Request, res: Response): Promise<void> => {
    const { categoryFilters, activityFilters, searchTerm } = req.body
    req.session.attendanceSummaryJourney.categoryFilters = categoryFilters ?? null
    req.session.attendanceSummaryJourney.activityFilters = activityFilters ?? null
    req.session.attendanceSummaryJourney.searchTerm = searchTerm ?? null

    res.redirect('back')
  }
}
