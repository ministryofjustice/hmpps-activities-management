import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { formatFirstLastName, parseDate } from '../../../../utils/utils'
import PrisonService from '../../../../services/prisonService'

import { Activity, Allocation, ExclusionRevision } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { activitySlotsMinusExclusions, sessionSlotsToSchedule } from '../../../../utils/helpers/activityTimeSlotMappers'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'
import UserService from '../../../../services/userService'
import CaseNotesService from '../../../../services/caseNotesService'
import logger from '../../../../../logger'
import getCurrentPay from '../../../../utils/helpers/getCurrentPay'
import { buildScheduleChangeViewModel, ScheduleChangeHistory } from '../../../../utils/helpers/scheduleChangeHistory'

type UserMap = Awaited<ReturnType<UserService['getUserMap']>>

const buildUserMap = async (usernames: string[], user: Express.User, userService: UserService): Promise<UserMap> => {
  const userMap: UserMap = new Map()

  await Promise.allSettled(
    [...new Set(usernames)].map(async username => {
      try {
        const users = await userService.getUserMap([username], user)

        users.forEach((value, key) => userMap.set(key, value))
      } catch {
        logger.info(`Failed to load user: ${username}`)
      }
    }),
  )

  return userMap
}

const getUsernames = (allocation: Allocation, latestScheduleChangeHistory: ScheduleChangeHistory): string[] =>
  [
    allocation.plannedSuspension?.plannedBy,
    allocation.allocatedBy,
    latestScheduleChangeHistory.week1?.changedBy,
    latestScheduleChangeHistory.week2?.changedBy,
  ].filter((username): username is string => username != null)

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

    const { slots, scheduleWeeks } = activity.schedules[0]

    const allocationSlots = activitySlotsMinusExclusions(allocation.exclusions, slots)
    const dailySlots = sessionSlotsToSchedule(scheduleWeeks, allocationSlots)

    const currentWeek = calcCurrentWeek(parseDate(activity.startDate), scheduleWeeks)

    const twoWeekSchedule = scheduleWeeks === 2

    const isStarted = new Date(allocation.startDate) <= new Date()

    const latestScheduleChangeHistory = buildScheduleChangeViewModel(
      allocation.allocatedTime,
      exclusionHistory,
      allocation.scheduleLastChanged ?? [],
      slots,
      scheduleWeeks,
    )

    const usernames = getUsernames(allocation, latestScheduleChangeHistory)

    const userMap = await buildUserMap(usernames, user, this.userService)

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
      latestScheduleChangeHistory,
      suspensionCaseNote,
      activityIsPaid: activity?.paid,
      twoWeekSchedule,
    })
  }
}
