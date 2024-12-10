import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { convertToTitleCase } from '../../../../utils/utils'
import { PrisonerSuspensionStatus } from '../../manage-allocations/journey'

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

    // const schedules = await Promise.all(
    //   allocations.map(a => this.activitiesService.getActivitySchedule(a.scheduleId, user)),
    // )

    // const activities = allocations.map(allocation => {
    //   const schedule = schedules.find(s => s.id === allocation.scheduleId)

    //   const allocationSlots = activitySlotsMinusExclusions(allocation.exclusions, schedule.slots)
    //   const slots = sessionSlotsToSchedule(schedule.scheduleWeeks, allocationSlots)

    //   return {
    //     allocation,
    //     currentWeek: calcCurrentWeek(parseDate(schedule.startDate), schedule.scheduleWeeks),
    //     slots,
    //   }
    // })

    const suspendedStatuses = [
      PrisonerSuspensionStatus.SUSPENDED as string,
      PrisonerSuspensionStatus.SUSPENDED_WITH_PAY as string,
    ]
    const sus = allocations.filter(all => suspendedStatuses.includes(all.status))
    console.log(sus)
    res.render('pages/activities/suspensions/view-allocations', {
      prisonerName: convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`),
      allocationCount: allocations.length,
      suspendedAllocations: allocations.filter(all => suspendedStatuses.includes(all.status)),
      activeAllocations: allocations.filter(all => !suspendedStatuses.includes(all.status)),
    })
  }
}
