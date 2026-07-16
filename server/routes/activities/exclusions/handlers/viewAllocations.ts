import { Request, Response } from 'express'
import { format, parseISO } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { formatFirstLastName, parseDate } from '../../../../utils/utils'
import { activitySlotsMinusExclusions, sessionSlotsToSchedule } from '../../../../utils/helpers/activityTimeSlotMappers'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'

const getLatestScheduleChange = (
  allocatedTime: string | null | undefined,
  activityScheduleUpdatedTime: string | null | undefined,
  prisonerScheduleUpdatedTimes: Array<string | null | undefined>,
): string | null => {
  const allocatedAt = allocatedTime ? parseISO(allocatedTime) : null

  const scheduleChangeDates = [activityScheduleUpdatedTime, ...prisonerScheduleUpdatedTimes]
    .filter((value): value is string => Boolean(value))
    .map(value => parseISO(value))
    .filter(changeDate => !allocatedAt || changeDate.getTime() > allocatedAt.getTime())

  if (scheduleChangeDates.length === 0) {
    return null
  }

  const latestScheduleChange = scheduleChangeDates.reduce((latest, current) =>
    current.getTime() > latest.getTime() ? current : latest,
  )

  return format(latestScheduleChange, 'd MMMM yyyy')
}

export default class ViewAllocationsRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { prisonerNumber } = req.params as { prisonerNumber: string }
    const { user } = res.locals

    req.session.prisonerSearchBackLinkHref = `/activities/exclusions/prisoner/${prisonerNumber}`

    const [prisoner, prisonerAllocations] = await Promise.all([
      this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user),
      this.activitiesService.getActivePrisonPrisonerAllocations([prisonerNumber], user),
    ])

    const allocations = prisonerAllocations.flatMap(result => result.allocations)

    const activities = await Promise.all(
      allocations.map(async allocation => {
        const [schedule, exclusionHistory] = await Promise.all([
          this.activitiesService.getActivitySchedule(allocation.scheduleId, user),
          this.activitiesService.getAllocationExclusionsHistory(allocation.id, user),
        ])

        const allocationSlots = activitySlotsMinusExclusions(allocation.exclusions, schedule.slots)
        const scheduledSlots = sessionSlotsToSchedule(schedule.scheduleWeeks, allocationSlots)

        const scheduleLastChanged = getLatestScheduleChange(
          allocation.allocatedTime,
          schedule.updatedTime,
          exclusionHistory.map(revision => revision.updatedDateTime),
        )

        return {
          allocation,
          activityName: schedule.description,
          currentWeek: calcCurrentWeek(parseDate(schedule.startDate), schedule.scheduleWeeks),
          scheduledSlots,
          scheduleLastChanged,
        }
      }),
    )

    res.render('pages/activities/exclusions/view-allocations', {
      prisonerName: formatFirstLastName(prisoner.firstName, prisoner.lastName),
      prisonerNumber,
      activities,
    })
  }
}
