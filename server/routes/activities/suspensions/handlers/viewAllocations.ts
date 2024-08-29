import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { convertToTitleCase, parseDate } from '../../../../utils/utils'
import { activitySlotsMinusExclusions, sessionSlotsToSchedule } from '../../../../utils/helpers/activityTimeSlotMappers'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'

export default class ViewAllocationsRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

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

    const activities = allocations.map(allocation => {
      const schedule = schedules.find(s => s.id === allocation.scheduleId)

      const allocationSlots = activitySlotsMinusExclusions(allocation.exclusions, schedule.slots)
      const slots = sessionSlotsToSchedule(schedule.scheduleWeeks, allocationSlots)

      return {
        allocation,
        currentWeek: calcCurrentWeek(parseDate(schedule.startDate), schedule.scheduleWeeks),
        slots,
      }
    })

    res.render('pages/activities/suspensions/view-allocations', {
      prisonerName: convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`),
      activities,
    })
  }
}
