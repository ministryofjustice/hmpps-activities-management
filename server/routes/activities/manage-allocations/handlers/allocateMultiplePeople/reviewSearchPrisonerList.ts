import { Request, Response } from 'express'
import NonAssociationsService from '../../../../../services/nonAssociationsService'
import ActivitiesService from '../../../../../services/activitiesService'
import enhancePrisonersWithNonAssocationsAndAllocations from '../../../../../utils/extraPrisonerInformation'

export default class ReviewSearchPrisonerListRoutes {
  constructor(
    private readonly nonAssociationsService: NonAssociationsService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { inmates } = req.session.allocateJourney

    const prisonerNumbers = inmates.map(prisoner => prisoner.prisonerNumber)
    const [prisonerAllocations, nonAssociations] = await Promise.all([
      this.activitiesService.getActivePrisonPrisonerAllocations(prisonerNumbers, user),
      this.nonAssociationsService.getListPrisonersWithNonAssociations(prisonerNumbers, user),
    ])

    const enhancedPrisoners = enhancePrisonersWithNonAssocationsAndAllocations(
      inmates,
      prisonerAllocations,
      nonAssociations,
    )

    return res.render('pages/activities/manage-allocations/allocateMultiplePeople/reviewSearchPrisonerList', {
      inmates: enhancedPrisoners,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    return res.redirect('activity-requirements-review')
  }

  REMOVE = async (req: Request, res: Response): Promise<void> => {
    const { prisonerNumber } = req.params

    req.session.allocateJourney.inmates = req.session.allocateJourney.inmates.filter(
      prisoner => prisoner.prisonerNumber !== prisonerNumber,
    )

    res.redirect('../../review-search-prisoner-list')
  }
}
