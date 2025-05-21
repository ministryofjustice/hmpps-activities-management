import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'

export default class PrisonerAllocationsHandler {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => {
    // const { prisonerNumber } = req.params

    // const allocations = await this.activitiesService.getAllocations(prisonerNumber)
    res.render('pages/activities/prisoner-allocations/dashboard')
  }

  POST = async (req: Request, res: Response) => {
    const { prisonId } = req.params
    // const { allocationId } = req.body

    // await this.activitiesService.updateAllocation(prisonId, allocationId)
    res.redirect(`/activities/prisoner-allocations/${prisonId}`)
  }
}
