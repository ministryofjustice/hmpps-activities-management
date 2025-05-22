import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'

export default class PrisonerAllocationsHandler {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => {
    res.render('pages/activities/prisoner-allocations/dashboard')
  }

  POST = async (req: Request, res: Response) => {
    res.redirect('/activities/prisoner-allocations')
  }
}
