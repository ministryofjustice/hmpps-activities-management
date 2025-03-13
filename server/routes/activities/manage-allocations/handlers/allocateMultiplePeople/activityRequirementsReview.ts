import { Request, Response } from 'express'

export default class ActivityRequirementsReviewRoutes {
  constructor() {}

  GET = async (req: Request, res: Response): Promise<void> => {
    // TODO: call api endpoint to find suitability of the selected prisoners
    // TODO: if all of the prisoners are suitable, redirect to next page

    return res.render('pages/activities/manage-allocations/allocateMultiplePeople/activityRequirementsReview', {
      prisonersWithMismatchedRequirements: [],
    })
  }

  REMOVE = async (req: Request, res: Response): Promise<void> => {
    const { prisonNumber } = req.params

    req.session.allocateJourney.inmates = req.session.allocateJourney.inmates.filter(
      prisoner => prisoner.prisonerNumber !== prisonNumber,
    )

    res.redirect('../../activityRequirementsReview')
  }
}
