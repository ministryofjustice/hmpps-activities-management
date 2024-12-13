import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { convertToTitleCase, parseDate } from '../../../../utils/utils'
import { Allocation } from '../../../../@types/activitiesAPI/types'
import { ServiceUser } from '../../../../@types/express'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import getCurrentPay from '../../../../utils/helpers/getCurrentPay'
import config from '../../../../config'
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

    let enhancedActiveAllocations = []
    const activeAllocations = allocations.filter(all => !all.plannedSuspension)

    if (config.suspendPrisonerWithPayToggleEnabled) {
      enhancedActiveAllocations = await this.enhanceActiveAllocations(activeAllocations, prisoner, res.locals.user)
    }

    // THESE LINES BELOW CAN BE REMOVED ONCE THE SUSPENSION PAY FLAG IS TRUE
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
    // LINES ABOVE CAN BE REMOVED

    const suspendedAllocations = allocations
      .filter(all => all.plannedSuspension)
      .sort((a, b) => (a.plannedSuspension.plannedStartDate < b.plannedSuspension.plannedStartDate ? -1 : 1))

    const sortedActiveAllocations = enhancedActiveAllocations.sort((a, b) =>
      a.activitySummary < b.activitySummary ? -1 : 1,
    )

    res.render('pages/activities/suspensions/view-allocations', {
      prisonerName: convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`),
      allocationCount: allocations.length,
      suspendedAllocations: config.suspendPrisonerWithPayToggleEnabled ? suspendedAllocations : [],
      activeAllocations: config.suspendPrisonerWithPayToggleEnabled ? sortedActiveAllocations : [],
      activeAllocationIdsForSuspending: config.suspendPrisonerWithPayToggleEnabled
        ? activeAllocations.map(allocation => allocation.id)
        : null,
      activities: config.suspendPrisonerWithPayToggleEnabled ? [] : activities, // this will be removed once suspension pay flag is set to true
    })
  }

  private enhanceActiveAllocations = async (activeAllocations: Allocation[], prisoner: Prisoner, user: ServiceUser) => {
    return Promise.all(
      activeAllocations.map(async allocation => {
        const activity = await this.activitiesService.getActivity(allocation.activityId, user)
        if (!activity.paid) return allocation

        const currentPay = getCurrentPay(activity, allocation, prisoner)
        return {
          ...allocation,
          payRate: currentPay?.rate,
        }
      }),
    )
  }
}
