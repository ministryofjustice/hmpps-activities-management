import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'

export class Filters {
  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : undefined)) // Transform to an array if only one value is provided
  categoryFilters?: string[]

  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : undefined)) // Transform to an array if only one value is provided
  activityFilters?: string[]
}

export default class ApplyFiltersRoutes {
  APPLY = async (req: Request, res: Response): Promise<void> => {
    const { categoryFilters, activityFilters } = req.body
    const searchTermArray = req.body.searchTerm
    let nonEmptySearchTerm = ``
    if (searchTermArray) {
      searchTermArray.forEach((search: string) => {
        if (search.trim() !== '') {
          nonEmptySearchTerm = search
        }
      })
    }

    if (categoryFilters) {
      req.session.attendanceSummaryJourney.categoryFilters = categoryFilters
    }

    if (activityFilters) {
      req.session.attendanceSummaryJourney.activityFilters = activityFilters
    }

    if (nonEmptySearchTerm || nonEmptySearchTerm === '') {
      req.session.attendanceSummaryJourney.searchTerm = nonEmptySearchTerm
    }

    res.redirect('back')
  }
}
