import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { convertToTitleCase, mapActivityModelSlotsToJourney, parseDate } from '../../../../utils/utils'
import activitySessionToDailyTimeSlots, {
  activitySlotsMinusExclusions,
} from '../../../../utils/helpers/activityTimeSlotMappers'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'

export default class ViewAllocationsRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { prisonerNumber } = req.params
    const { user } = res.locals

    const prisoner = await this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user)

    const allocations = await this.activitiesService
      .getActivePrisonPrisonerAllocations([prisonerNumber], user)
      .then(r => r.flatMap(a => a.allocations))

    const schedules = await Promise.all(
      allocations.map(a => this.activitiesService.getActivitySchedule(a.scheduleId, user)),
    )

    const activities = allocations.map(a => {
      const schedule = schedules.find(s => s.id === a.scheduleId)

      const allocationSlots = activitySlotsMinusExclusions(a.exclusions, schedule.slots)
      const journeySlots = mapActivityModelSlotsToJourney(allocationSlots)
      const dailySlots = activitySessionToDailyTimeSlots(schedule.scheduleWeeks, journeySlots)

      return {
        allocationId: a.id,
        activityName: schedule.description,
        currentWeek: calcCurrentWeek(parseDate(schedule.startDate), schedule.scheduleWeeks),
        scheduledSlots: dailySlots,
      }
    })

    res.render('pages/activities/exclusions/view-allocations', {
      prisonerName: convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`),
      activities,
    })
  }
}
