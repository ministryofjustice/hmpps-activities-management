import { Request, Response } from 'express'
import { parseISO } from 'date-fns'
import PrisonService from '../../../../services/prisonService'
import activitySessionToDailyTimeSlots from '../../../../utils/helpers/activityTimeSlotMappers'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'
import { mapActivityModelSlotsToJourney } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'
import IncentiveLevelPayMappingUtil from '../../../../utils/helpers/incentiveLevelPayMappingUtil'
import { eventTierDescriptions } from '../../../../enum/eventTiers'
import { organiserDescriptions } from '../../../../enum/eventOrganisers'

export default class ActivityRoutes {
  private readonly helper: IncentiveLevelPayMappingUtil

  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {
    this.helper = new IncentiveLevelPayMappingUtil(prisonService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { activityId } = req.params

    const activity = await this.activitiesService.getActivity(+activityId, res.locals.user)
    const schedule = activity.schedules[0]

    const journeySlots = mapActivityModelSlotsToJourney(schedule.slots)
    const dailySlots = activitySessionToDailyTimeSlots(schedule.scheduleWeeks, journeySlots)
    const incentiveLevelPays = await this.helper.getPayGroupedByIncentiveLevel(activity.pay, schedule.allocations, user)
    const richStartDate = parseISO(activity.startDate)
    const currentWeek = calcCurrentWeek(richStartDate, schedule.scheduleWeeks)

    res.render('pages/activities/manage-activities/view-activity', {
      activity,
      schedule,
      dailySlots,
      incentiveLevelPays,
      currentWeek,
      tier: eventTierDescriptions[activity.tier?.code],
      organiser: organiserDescriptions[activity.organiser?.code],
    })
  }
}
