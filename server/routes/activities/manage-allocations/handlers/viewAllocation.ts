import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { formatFirstLastName, parseDate } from '../../../../utils/utils'
import PrisonService from '../../../../services/prisonService'

import {
  Activity,
  ActivityScheduleSlot,
  Allocation,
  ExclusionRevision,
  ScheduleLastChanged,
} from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import {
  activitySlotsMinusExclusions,
  getFullDayFromAbbreviation,
  sessionSlotsToSchedule,
} from '../../../../utils/helpers/activityTimeSlotMappers'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'
import UserService from '../../../../services/userService'
import CaseNotesService from '../../../../services/caseNotesService'
import logger from '../../../../../logger'
import getCurrentPay from '../../../../utils/helpers/getCurrentPay'

type ExclusionChangeEvent = {
  type: 'EXCLUSION'
  weekNumber: number
  changedAt: string
  changedBy: string
  addedToSchedule: ScheduleDisplayItem[]
  removedFromSchedule: ScheduleDisplayItem[]
}

type ScheduleChangeEvent = {
  type: 'ACTIVITY'
  weekNumber: number
  changedAt: string
  changedBy: string
  addedToSchedule: ScheduleDisplayItem[]
  removedFromSchedule: ScheduleDisplayItem[]
}

type ScheduleDisplayItem = {
  weekNumber: number
  dayOfWeek: string
  timeSlots: string[]
}

type ChangeEvent = ExclusionChangeEvent | ScheduleChangeEvent

type ScheduleChangeHistory = {
  week1: ChangeEvent | null
  week2: ChangeEvent | null
}

const mapExclusionHistoryToEvents = (exclusionHistory: ExclusionRevision[]): ExclusionChangeEvent[] => {
  return Object.values(
    exclusionHistory.reduce<Record<string, ExclusionChangeEvent>>((accumulator, record) => {
      const key = `${record.revision}-${record.weekNumber}`

      if (!accumulator[key]) {
        accumulator[key] = {
          type: 'EXCLUSION',
          weekNumber: record.weekNumber,
          changedAt: record.updatedDateTime,
          changedBy: record.updatedBy,
          addedToSchedule: [],
          removedFromSchedule: [],
        }
      }

      const displayItem: ScheduleDisplayItem = {
        weekNumber: record.weekNumber,
        dayOfWeek: record.dayOfWeek,
        timeSlots: record.timeSlots,
      }

      if (record.revisionType === 'ADDED') {
        accumulator[key].removedFromSchedule.push(displayItem)
      }

      if (record.revisionType === 'REMOVED') {
        accumulator[key].addedToSchedule.push(displayItem)
      }

      return accumulator
    }, {}),
  )
}

const mapScheduleHistoryToEvents = (scheduleHistory: ScheduleLastChanged[]): ScheduleChangeEvent[] => {
  return scheduleHistory.map(history => ({
    type: 'ACTIVITY',
    weekNumber: history.weekNumber,
    changedAt: history.changedAt,
    changedBy: history.changedBy,
    addedToSchedule: history.addedSessions.map(session => ({
      weekNumber: session.weekNumber,
      dayOfWeek: session.dayOfWeek,
      timeSlots: [session.timeSlot],
    })),
    removedFromSchedule: history.removedSessions.map(session => ({
      weekNumber: session.weekNumber,
      dayOfWeek: session.dayOfWeek,
      timeSlots: [session.timeSlot],
    })),
  }))
}

const slotExistsInActivitySchedule = (activitySlots: ActivityScheduleSlot[], item: ScheduleDisplayItem): boolean => {
  return activitySlots.some(
    slot =>
      slot.weekNumber === item.weekNumber &&
      item.timeSlots.includes(slot.timeSlot) &&
      slot.daysOfWeek.some(day => getFullDayFromAbbreviation(day) === item.dayOfWeek),
  )
}

const filterInvalidExclusionEvents = (
  event: ChangeEvent,
  scheduleWeeks: number,
  activitySlots: ActivityScheduleSlot[],
): ChangeEvent | null => {
  // For one-week schedules, hide exclusion-removal events
  // where the session being added back no longer exists on the activity schedule
  if (scheduleWeeks !== 1 || event.type !== 'EXCLUSION' || !event.addedToSchedule.length) {
    return event
  }
  return event.addedToSchedule.some(item => slotExistsInActivitySchedule(activitySlots, item)) ? event : null
}

const buildLatestEventsByWeek = (events: ChangeEvent[]): ScheduleChangeHistory => ({
  week1: getLatestForWeek(events.filter(event => event.weekNumber === 1)),
  week2: getLatestForWeek(events.filter(event => event.weekNumber === 2)),
})

const getLatestForWeek = (events: ChangeEvent[]): ChangeEvent | null => {
  if (!events.length) {
    return null
  }

  return events.reduce((latest, current) => (current.changedAt > latest.changedAt ? current : latest))
}

const buildScheduleChangeViewModel = (
  allocatedTime: string | null | undefined,
  exclusionHistory: ExclusionRevision[],
  scheduleHistory: ScheduleLastChanged[],
  activitySlots: ActivityScheduleSlot[],
  scheduleWeeks: number,
): ScheduleChangeHistory => {
  const events = [...mapExclusionHistoryToEvents(exclusionHistory), ...mapScheduleHistoryToEvents(scheduleHistory)]

  const relevantEvents = allocatedTime ? events.filter(event => event.changedAt > allocatedTime) : events

  const visibleEvents = relevantEvents
    .map(event => filterInvalidExclusionEvents(event, scheduleWeeks, activitySlots))
    .filter((event): event is ChangeEvent => event !== null)

  return buildLatestEventsByWeek(visibleEvents)
}

const buildUserMap = async (usernames: string[], user: Express.User, userService: UserService) => {
  const userMap = new Map<string, unknown>()

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
