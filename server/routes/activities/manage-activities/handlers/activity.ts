import { Request, Response } from 'express'
import { parseISO } from 'date-fns'
import PrisonService from '../../../../services/prisonService'
import { sessionSlotsToSchedule } from '../../../../utils/helpers/activityTimeSlotMappers'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'
import ActivitiesService from '../../../../services/activitiesService'
import BankHolidayService from '../../../../services/bankHolidayService'
import IncentiveLevelPayMappingUtil from '../../../../utils/helpers/incentiveLevelPayMappingUtil'
import ActivityDateValidator from '../../../../utils/helpers/activityDateValidator'
import { eventTierDescriptions } from '../../../../enum/eventTiers'
import { organiserDescriptions } from '../../../../enum/eventOrganisers'
import { groupPayBand } from '../../../../utils/helpers/payBandMappingUtil'
import { ActivitySchedule, Allocation } from '../../../../@types/activitiesAPI/types'

export default class ActivityRoutes {
  private readonly helper: IncentiveLevelPayMappingUtil

  private readonly activityDateValidator: ActivityDateValidator

  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
    private readonly bankHolidayService: BankHolidayService,
  ) {
    this.helper = new IncentiveLevelPayMappingUtil(prisonService)
    this.activityDateValidator = new ActivityDateValidator(bankHolidayService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { activityId } = req.params

    const activity = await this.activitiesService.getActivity(+activityId, res.locals.user)
    const schedule = activity.schedules[0]
    const payEditable: boolean = editPay(schedule)

    const slots = sessionSlotsToSchedule(schedule.scheduleWeeks, schedule.slots)
    const incentiveLevelPays = await this.helper.getPayGroupedByIncentiveLevel(activity.pay, schedule.allocations, user)
    const displayPays = groupPayBand(incentiveLevelPays)

    const richStartDate = parseISO(activity.startDate)
    const currentWeek = calcCurrentWeek(richStartDate, schedule.scheduleWeeks)

    const hasAtLeastOneValidDay = await this.activityDateValidator.hasAtLeastOneValidDayInActivity(
      activity.startDate,
      activity.endDate,
      schedule.scheduleWeeks,
      slots,
      user,
    )
    if (!hasAtLeastOneValidDay) {
      schedule.runsOnBankHoliday = true
    }

    res.render('pages/activities/manage-activities/view-activity', {
      activity,
      schedule,
      payEditable,
      slots,
      incentiveLevelPays,
      displayPays,
      currentWeek,
      hasAtLeastOneValidDay,
      tier: eventTierDescriptions[activity.tier?.code],
      organiser: organiserDescriptions[activity.organiser?.code],
    })
  }
}

export function editPay(schedule: ActivitySchedule): boolean {
  return schedule.activity.paid || allEnded(schedule.allocations)
}

function allEnded(allocations: Allocation[]): boolean {
  return allocations.filter(alloc => alloc.status !== 'ENDED').length === 0
}
