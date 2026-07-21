import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { formatFirstLastName, parseDate } from '../../../../utils/utils'
import PrisonService from '../../../../services/prisonService'
import { Activity, ExclusionRevision } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { activitySlotsMinusExclusions, sessionSlotsToSchedule } from '../../../../utils/helpers/activityTimeSlotMappers'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'
import UserService from '../../../../services/userService'
import CaseNotesService from '../../../../services/caseNotesService'
import logger from '../../../../../logger'
import getCurrentPay from '../../../../utils/helpers/getCurrentPay'
import { parseISO } from 'date-fns'

type LatestScheduleChange = Pick<ExclusionRevision, 'updatedDateTime' | 'updatedBy'>

const getLatestScheduleChange = (
  allocatedTime: string | null | undefined,
  scheduleUpdatedTime: string | null | undefined,
  exclusionHistory: ExclusionRevision[],
): LatestScheduleChange | null => {
  if (!allocatedTime || !scheduleUpdatedTime) {
    return null
  }

  const allocatedAt = parseISO(allocatedTime)

  if (parseISO(scheduleUpdatedTime).getTime() <= allocatedAt.getTime()) {
    return null
  }

  const changesSinceAllocation = exclusionHistory.filter(
    change => parseISO(change.updatedDateTime).getTime() > allocatedAt.getTime(),
  )

  if (changesSinceAllocation.length === 0) {
    return null
  }

  const latestChange = changesSinceAllocation.reduce((latest, current) =>
    parseISO(current.updatedDateTime).getTime() > parseISO(latest.updatedDateTime).getTime() ? current : latest,
  )

  return {
    updatedDateTime: latestChange.updatedDateTime,
    updatedBy: latestChange.updatedBy,
  }
}

export default class ViewAllocationRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
    private readonly caseNotesService: CaseNotesService,
    private readonly userService: UserService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { allocationId } = req.params

    const allocation = await this.activitiesService.getAllocation(+allocationId, user)

    const [activity, prisoner, exclusionHistory]: [Activity, Prisoner, ExclusionRevision[]] = await Promise.all([
      this.activitiesService.getActivity(allocation.activityId, user),
      this.prisonService.getInmateByPrisonerNumber(allocation.prisonerNumber, user),
      this.activitiesService.getAllocationExclusionsHistory(allocation.id, user),
    ])

    const prisonerName = formatFirstLastName(prisoner.firstName, prisoner.lastName)

    const isOnlyPay =
      activity.pay.filter(
        p => p.incentiveLevel === prisoner.currentIncentive?.level?.description && p.startDate == null,
      ).length === 1

    const currentPay = getCurrentPay(activity, allocation, prisoner)

    const schedule = activity.schedules.find(item => item.id === allocation.scheduleId)

    if (!schedule) {
      throw new Error(`Schedule ${allocation.scheduleId} not found for activity ${allocation.activityId}`)
    }

    const latestScheduleChange = getLatestScheduleChange(
      allocation.allocatedTime,
      schedule.updatedTime,
      exclusionHistory,
    )

    const allocationSlots = activitySlotsMinusExclusions(allocation.exclusions, schedule.slots)
    const dailySlots = sessionSlotsToSchedule(schedule.scheduleWeeks, allocationSlots)

    const currentWeek = calcCurrentWeek(parseDate(activity.startDate), schedule.scheduleWeeks)

    const isStarted = new Date(allocation.startDate) <= new Date()

    const userMap = await this.userService.getUserMap(
      [allocation.plannedSuspension?.plannedBy, latestScheduleChange?.updatedBy],
      user,
    )

    try {
      const allocatedByUser = await this.userService.getUserMap([allocation.allocatedBy], user)
      allocatedByUser.forEach((value, key) => userMap.set(key, value))
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      logger.info(`Handled allocatedBy user ${allocation.allocatedBy} not found.`)
    }

    const suspensionCaseNote = allocation.plannedSuspension?.dpsCaseNoteId
      ? await this.caseNotesService.getCaseNote(
          allocation.prisonerNumber,
          allocation.plannedSuspension?.dpsCaseNoteId,
          user,
        )
      : null

    res.render('pages/activities/manage-allocations/view-allocation', {
      allocation,
      prisonerName,
      pay: currentPay,
      isStarted,
      isOnlyPay,
      dailySlots,
      currentWeek,
      userMap,
      suspensionCaseNote,
      activityIsPaid: activity?.paid,
      latestScheduleChange,
    })
  }
}
