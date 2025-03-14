import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'

export default class ActivityRequirementsReviewRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { inmates, activity } = req.session.allocateJourney

    const inmatesSuitability = await Promise.all(
      inmates.map(async inmate => {
        const suitability = await this.activitiesService.allocationSuitability(
          activity.scheduleId,
          inmate.prisonerNumber,
          user,
        )
        return {
          prisonerNumber: inmate.prisonerNumber,
          prisonerName: inmate.prisonerName,
          ...suitability,
        }
      }),
    )

    const prisonersWithMismatchedRequirements = inmatesSuitability.filter(
      inmate =>
        inmate.workplaceRiskAssessment.suitable === false ||
        inmate.education.suitable === false ||
        inmate.releaseDate.suitable === false,
    )
    // skip loading this page if there are no failures to meet requirements
    if (prisonersWithMismatchedRequirements.length === 0) res.redirect('#')

    return res.render('pages/activities/manage-allocations/allocateMultiplePeople/activityRequirementsReview', {
      prisoners: prisonersWithMismatchedRequirements,
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
