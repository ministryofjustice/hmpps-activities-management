import { Request, Response } from 'express'
import { IsOptional } from 'class-validator'

export class Filters {
  @IsOptional()
  searchTerm?: string

  @IsOptional()
  locationFilters?: string | string[]
}

export default class ApplyFiltersRoutes {
  APPLY = async (req: Request, res: Response): Promise<void> => {
    const { searchTerm, locationFilters } = req.body

    if (searchTerm) {
      req.journeyData.recordAttendanceJourney.searchTerm = searchTerm || ''
    }

    if (locationFilters) {
      req.journeyData.recordAttendanceJourney.subLocationFilters = locationFilters
    }

    // Redirect back to the referrer or a default location
    const referrer = req.get('referer') || '/activities/attend-all'
    return res.redirect(referrer)
  }
}
