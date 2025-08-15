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

    req.journeyData.attendanceSummaryJourney.categoryFilters = categoryFilters ?? []
    req.journeyData.attendanceSummaryJourney.reasonFilter = reasonFilter ?? 'BOTH'
    req.journeyData.attendanceSummaryJourney.searchTerm = searchTerm ?? null

    if (isAbsencesFilter) {
      req.journeyData.attendanceSummaryJourney.absenceReasonFilters = absenceReasonFilters ?? []
      req.journeyData.attendanceSummaryJourney.payFilters = payFilters ?? []
    } else {
      req.journeyData.attendanceSummaryJourney.absenceReasonFilters = undefined
      req.journeyData.attendanceSummaryJourney.payFilters = undefined
    }

    res.redirect(req.get('Referrer') || '/')
  }
}
