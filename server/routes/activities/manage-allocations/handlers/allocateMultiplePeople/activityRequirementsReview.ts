import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'

export default class ActivityRequirementsReviewRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { inmates, activity } = req.journeyData.allocateJourney

    if (inmates.length < 1)
      return res.render('pages/activities/manage-allocations/allocateMultiplePeople/activityRequirementsReview', {
        prisoners: [],
      })

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

    if (!prisonersWithMismatchedRequirements.length) {
      if (req.query?.prisonerRemoved)
        return res.render('pages/activities/manage-allocations/allocateMultiplePeople/activityRequirementsReview', {
          prisoners: [],
        })
      // skip loading this page if there are no failures to meet requirements
      req.journeyData.allocateJourney.allocateMultipleInmatesMode = true
      return res.redirect('../start-date')
    }

    return res.render('pages/activities/manage-allocations/allocateMultiplePeople/activityRequirementsReview', {
      prisoners: prisonersWithMismatchedRequirements,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.journeyData.allocateJourney.allocateMultipleInmatesMode = true
    return res.redirect('../start-date')
  }

  REMOVE = async (req: Request, res: Response): Promise<void> => {
    const { prisonerNumber } = req.params

    req.journeyData.allocateJourney.inmates = req.journeyData.allocateJourney.inmates.filter(
      prisoner => prisoner.prisonerNumber !== prisonerNumber,
    )

    res.redirect('../../activity-requirements-review?prisonerRemoved=true')
  }
}
