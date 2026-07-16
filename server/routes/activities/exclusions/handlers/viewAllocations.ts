import { Request, Response } from 'express'
import { format, parseISO } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { formatFirstLastName, parseDate } from '../../../../utils/utils'
import { activitySlotsMinusExclusions, sessionSlotsToSchedule } from '../../../../utils/helpers/activityTimeSlotMappers'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'

export default class ViewAllocationsRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { prisonerNumber } = req.params as { prisonerNumber: string }
    const { user } = res.locals

    req.session.prisonerSearchBackLinkHref = `/activities/exclusions/prisoner/${prisonerNumber}`

    const prisoner = await this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user)

    const allocations = await this.activitiesService
      .getActivePrisonPrisonerAllocations([prisonerNumber], user)
      .then(response => response.flatMap(result => result.allocations))

    const schedules = await Promise.all(
      allocations.map(allocation => this.activitiesService.getActivitySchedule(allocation.scheduleId, user)),
    )

    const exclusionHistories = await Promise.all(
      allocations.map(allocation => this.activitiesService.getAllocationExclusionsHistory(allocation.id, user)),
    )

    const activities = allocations.map((allocation, index) => {
      const schedule = schedules[index]
      const exclusionHistory = exclusionHistories[index]

      const allocationSlots = activitySlotsMinusExclusions(allocation.exclusions, schedule.slots)
      const dailySlots = sessionSlotsToSchedule(schedule.scheduleWeeks, allocationSlots)

      const latestPrisonerScheduleChange = exclusionHistory.reduce<string | null>((latest, revision) => {
        if (!latest) return revision.updatedDateTime

        return new Date(revision.updatedDateTime) > new Date(latest) ? revision.updatedDateTime : latest
      }, null)

      const latestScheduleChange = [schedule.updatedTime, latestPrisonerScheduleChange]
        .filter((value): value is string => Boolean(value))
        .sort((first, second) => new Date(second).getTime() - new Date(first).getTime())[0]

      return {
        allocation,
        activityName: schedule.description,
        currentWeek: calcCurrentWeek(parseDate(schedule.startDate), schedule.scheduleWeeks),
        scheduledSlots: dailySlots,
        scheduleLastChanged: latestScheduleChange ? format(parseISO(latestScheduleChange), 'd MMMM yyyy') : null,
      }
    })

    res.render('pages/activities/exclusions/view-allocations', {
      prisonerName: formatFirstLastName(prisoner.firstName, prisoner.lastName),
      prisonerNumber,
      activities,
    })
  }
}
