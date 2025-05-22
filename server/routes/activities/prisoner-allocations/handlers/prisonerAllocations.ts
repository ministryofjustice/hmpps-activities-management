import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import config from '../../../../config'

export default class PrisonerAllocationsHandler {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => {
    if (!config.prisonerAllocationsEnabled) {
      return res.redirect('/activities')
    }
    return res.render('pages/activities/prisoner-allocations/dashboard')
  }

  POST = async (req: Request, res: Response) => {
    res.redirect('/activities/prisoner-allocations')
  }
}
