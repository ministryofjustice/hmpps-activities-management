import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { AddCaseNoteRequest, DeallocationReasonCode } from '../../../../@types/activitiesAPI/types'
import {
  activitySlotsMinusExclusions,
  mergeExclusionSlots,
  sessionSlotsToSchedule,
} from '../../../../utils/helpers/activityTimeSlotMappers'
import { parseDate } from '../../../../utils/utils'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'
import { DeallocateTodayOption, StartDateOption } from '../journey'

export default class CheckAnswersRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { deallocationReason, activity, updatedExclusions } = req.session.allocateJourney
    const deallocationReasons = await this.activitiesService.getDeallocationReasons(user)

    const schedule = await this.activitiesService.getActivitySchedule(activity.scheduleId, user)

    const allocationSlots = activitySlotsMinusExclusions(mergeExclusionSlots(updatedExclusions), schedule.slots)
    const dailySlots = sessionSlotsToSchedule(schedule.scheduleWeeks, allocationSlots)
    const currentWeek = calcCurrentWeek(parseDate(activity.startDate), schedule.scheduleWeeks)

    res.render('pages/activities/manage-allocations/check-answers', {
      deallocationReason: deallocationReasons.find(r => r.code === deallocationReason),
      dailySlots,
      currentWeek,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const {
      inmate,
      inmates,
      activity,
      startDate,
      endDate,
      deallocationReason,
      deallocationCaseNote,
      updatedExclusions,
      startDateOption,
      scheduledInstance,
      deallocateTodayOption,
    } = req.session.allocateJourney
    const { user } = res.locals

    if (req.routeContext.mode === 'create') {
      await this.activitiesService.allocateToSchedule(
        activity.scheduleId,
        inmate.prisonerNumber,
        inmate.payBand?.id,
        user,
        startDate,
        endDate,
        mergeExclusionSlots(updatedExclusions),
        startDateOption === StartDateOption.NEXT_SESSION ? scheduledInstance?.id : null,
      )
    }

    if (req.routeContext.mode === 'remove') {
      await this.activitiesService.deallocateFromActivity(
        activity.scheduleId,
        inmates.map(p => p.prisonerNumber),
        deallocationReason as DeallocationReasonCode,
        deallocationCaseNote as AddCaseNoteRequest,
        endDate,
        user,
        deallocateTodayOption === DeallocateTodayOption.TODAY ? scheduledInstance?.id : null,
      )
    }

    res.redirect('confirmation')
  }
}
