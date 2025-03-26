import { Request, Response } from 'express'
import NonAssociationsService from '../../../../../services/nonAssociationsService'
import ActivitiesService from '../../../../../services/activitiesService'

export default class ReviewSearchPrisonerListRoutes {
  constructor(
    private readonly nonAssociationsService: NonAssociationsService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { inmates } = req.session.allocateJourney
    const { preserveHistory } = req.query

    if (!inmates.length) return res.redirect('select-prisoner')

    return res.render('pages/activities/manage-allocations/allocateMultiplePeople/reviewSearchPrisonerList', {
      inmates,
      preserveHistory,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.query.preserveHistory) return res.redirect('check-answers')
    return res.redirect('activity-requirements-review')
  }

  REMOVE = async (req: Request, res: Response): Promise<void> => {
    const { prisonerNumber } = req.params
    const { preserveHistory } = req.query

    req.session.allocateJourney.inmates = req.session.allocateJourney.inmates.filter(
      prisoner => prisoner.prisonerNumber !== prisonerNumber,
    )

    res.redirect(`../../review-search-prisoner-list${preserveHistory ? '?preserveHistory=true' : ''}`)
  }
}
