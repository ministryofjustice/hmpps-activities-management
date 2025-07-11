import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'

export class Filters {
  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : undefined)) // Transform to an array if only one value is provided
  categoryFilters?: string[]

  @Expose()
  @Transform(({ value }) =>
    value
      ? [value]
          .flat()
          .map(v => v.trim())
          .find(v => v !== '')
      : undefined,
  )
  reasonFilter?: string

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
    const { categoryFilters, reasonFilter, searchTerm, absenceReasonFilters, payFilters, isAbsencesFilter } = req.body

    req.session.attendanceSummaryJourney.categoryFilters = categoryFilters ?? []
    req.session.attendanceSummaryJourney.reasonFilter = reasonFilter ?? 'BOTH'
    req.session.attendanceSummaryJourney.searchTerm = searchTerm ?? null

    if (isAbsencesFilter) {
      req.session.attendanceSummaryJourney.absenceReasonFilters = absenceReasonFilters ?? []
      req.session.attendanceSummaryJourney.payFilters = payFilters ?? []
    } else {
      req.session.attendanceSummaryJourney.absenceReasonFilters = undefined
      req.session.attendanceSummaryJourney.payFilters = undefined
    }

    res.redirect(req.get('Referrer') || '/')
  }
}
