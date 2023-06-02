import { Request, Response } from 'express'
import ActivitiesService from '../../../services/activitiesService'
import { convertToTitleCase } from '../../../utils/utils'
import PrisonService from '../../../services/prisonService'

export default class CheckAllocationRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const [schedule, prisoner, iepSummary] = await Promise.all([
      this.activitiesService.getActivitySchedule(+req.params.scheduleId, user),
      this.prisonService.getInmateByPrisonerNumber(req.params.prisonerNumber, user),
      this.prisonService.getPrisonerIepSummary(req.params.prisonerNumber, user),
    ])

    const allocation = schedule.allocations.find(a => a.prisonerNumber === req.params.prisonerNumber)
    const prisonerName = convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`)

    const activity = await this.activitiesService.getActivity(schedule.activity.id, user)
    const isOnlyPay = activity.pay.filter(p => p.incentiveLevel === iepSummary?.iepLevel).length === 1
    const pay = activity.pay.find(a => a.prisonPayBand.id === allocation.prisonPayBand.id)

    const isStarted = new Date(allocation.startDate) <= new Date()

    res.render('pages/allocation-dashboard/check-answers', { allocation, prisonerName, pay, isStarted, isOnlyPay })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    res.redirect(`/allocation-dashboard/${req.params.scheduleId}`)
  }
}
