import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { DeallocationReasonCode } from '../../../../@types/activitiesAPI/types'
import activitySessionToDailyTimeSlots, {
  activitySlotsMinusExclusions,
} from '../../../../utils/helpers/activityTimeSlotMappers'
import { mapActivityModelSlotsToJourney, parseDate } from '../../../../utils/utils'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'

export default class CheckAnswersRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { deallocationReason, activity, updatedExclusions } = req.session.allocateJourney
    const deallocationReasons = await this.activitiesService.getDeallocationReasons(user)

    const schedule = await this.activitiesService.getActivitySchedule(activity.scheduleId, user)
    const allocationSlots = activitySlotsMinusExclusions(updatedExclusions, schedule.slots)
    const journeySlots = mapActivityModelSlotsToJourney(allocationSlots)
    const dailySlots = activitySessionToDailyTimeSlots(schedule.scheduleWeeks, journeySlots)
    const currentWeek = calcCurrentWeek(parseDate(activity.startDate), schedule.scheduleWeeks)

    res.render('pages/activities/manage-allocations/check-answers', {
      deallocationReason: deallocationReasons.find(r => r.code === deallocationReason)?.description,
      dailySlots,
      currentWeek,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { inmate, inmates, activity, startDate, endDate, deallocationReason, updatedExclusions } =
      req.session.allocateJourney
    const { user } = res.locals

    if (req.params.mode === 'create') {
      await this.activitiesService.allocateToSchedule(
        activity.scheduleId,
        inmate.prisonerNumber,
        inmate.payBand?.id,
        user,
        startDate,
        endDate,
        updatedExclusions,
      )
    }

    if (req.params.mode === 'remove') {
      await this.activitiesService.deallocateFromActivity(
        activity.scheduleId,
        inmates.map(p => p.prisonerNumber),
        deallocationReason as DeallocationReasonCode,
        endDate,
        user,
      )
    }

    res.redirect('confirmation')
  }
}
