import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { convertToTitleCase } from '../../../../utils/utils'
import PrisonService from '../../../../services/prisonService'
import { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'

export default class CheckAllocationRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const [schedule, prisoner, iepSummary] = await Promise.all([
      this.activitiesService.getActivitySchedule(+req.params.activityId, user),
      this.prisonService.getInmateByPrisonerNumber(req.params.prisonerNumber, user),
      this.prisonService.getPrisonerIepSummary(req.params.prisonerNumber, user),
    ])

    const allocation = schedule.allocations.find(a => a.prisonerNumber === req.params.prisonerNumber)
    const prisonerName = convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`)

    const activity = await this.activitiesService.getActivity(schedule.activity.id, user)
    const isOnlyPay = activity.pay.filter(p => p.incentiveLevel === iepSummary?.iepLevel).length === 1
    const pay = activity.pay.find(
      a => a.prisonPayBand.id === allocation.prisonPayBand.id && a.incentiveLevel === iepSummary?.iepLevel,
    )

    const isStarted = new Date(allocation.startDate) <= new Date()

    req.session.allocateJourney = {
      inmate: {
        prisonerNumber: req.params.prisonerNumber,
        prisonerName: convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`),
        incentiveLevel: iepSummary?.iepLevel,
      },
      activity: {
        activityId: schedule.activity.id,
        scheduleId: schedule.id,
        name: schedule.description,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
      },
      startDate: simpleDateFromDate(new Date(allocation.startDate)),
      endDate: allocation.endDate ? simpleDateFromDate(new Date(allocation.endDate)) : undefined,
      deallocationReason: allocation.plannedDeallocation?.plannedReason.code || undefined,
    }

    res.render('pages/activities/allocation-dashboard/check-answers', {
      allocation,
      prisonerName,
      pay,
      isStarted,
      isOnlyPay,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    res.redirect(`/activities/allocation-dashboard/${req.params.activityId}`)
  }
}
