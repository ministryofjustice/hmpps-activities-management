import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'

export class Filters {
  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : undefined)) // Transform to an array if only one value is provided
  alertFilters?: string[]
}

export default class ApplyFiltersRoutes {
  APPLY = async (req: Request, res: Response): Promise<void> => {
    const { alertFilters } = req.body

    req.session.movementListJourney.alertFilters = alertFilters ?? []

    res.redirect('back')
  }
}
