import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { formatFirstLastName, parseDate } from '../../../../utils/utils'
import PrisonService from '../../../../services/prisonService'
import { Activity, ExclusionRevision, ScheduleLastChanged } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { activitySlotsMinusExclusions, sessionSlotsToSchedule } from '../../../../utils/helpers/activityTimeSlotMappers'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'
import UserService from '../../../../services/userService'
import CaseNotesService from '../../../../services/caseNotesService'
import logger from '../../../../../logger'
import getCurrentPay from '../../../../utils/helpers/getCurrentPay'

type ExclusionChangeEvent = {
  type: 'PRISONER'
  weekNumber: number
  changedAt: string
  changedBy: string
  added: ScheduleDisplayItem[]
  removed: ScheduleDisplayItem[]
}

type ScheduleChangeEvent = {
  type: 'ACTIVITY'
  weekNumber: number
  changedAt: string
  changedBy: string
  added: ScheduleDisplayItem[]
  removed: ScheduleDisplayItem[]
}

type ScheduleDisplayItem = {
  weekNumber: number
  dayOfWeek: string
  timeSlots: string[]
}

type ChangeEvent = ExclusionChangeEvent | ScheduleChangeEvent

const mapExclusionHistoryToEvents = (exclusionHistory: ExclusionRevision[]): ExclusionChangeEvent[] => {
  return Object.values(
    exclusionHistory.reduce<Record<string, ExclusionChangeEvent>>((accumulator, record) => {
      const key = `${record.revision}-${record.weekNumber}`

      if (!accumulator[key]) {
        accumulator[key] = {
          type: 'PRISONER',
          weekNumber: record.weekNumber,
          changedAt: record.updatedDateTime,
          changedBy: record.updatedBy,
          added: [],
          removed: [],
        }
      }

      const displayItem: ScheduleDisplayItem = {
        weekNumber: record.weekNumber,
        dayOfWeek: record.dayOfWeek,
        timeSlots: record.timeSlots,
      }

      if (record.revisionType === 'ADDED') {
        accumulator[key].added.push(displayItem)
      }

      if (record.revisionType === 'REMOVED') {
        accumulator[key].removed.push(displayItem)
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
    added: history.addedSessions.map(session => ({
      weekNumber: session.weekNumber,
      dayOfWeek: session.dayOfWeek,
      timeSlots: [session.timeSlot],
    })),
    removed: history.removedSessions.map(session => ({
      weekNumber: session.weekNumber,
      dayOfWeek: session.dayOfWeek,
      timeSlots: [session.timeSlot],
    })),
  }))
}

const getLatestForWeek = (events: ChangeEvent[]) => {
  if (!events.length) {
    return null
  }

  return events.reduce((latest, current) => (current.changedAt > latest.changedAt ? current : latest))
}

const buildScheduleChangeViewModel = (
  allocatedTime: string | null | undefined,
  exclusionHistory: ExclusionRevision[],
  scheduleHistory: ScheduleLastChanged[],
) => {
  const events = [...mapExclusionHistoryToEvents(exclusionHistory), ...mapScheduleHistoryToEvents(scheduleHistory)]

  const relevantEvents = allocatedTime ? events.filter(event => event.changedAt > allocatedTime) : events

  return {
    week1: getLatestForWeek(relevantEvents.filter(event => event.weekNumber === 1)),

    week2: getLatestForWeek(relevantEvents.filter(event => event.weekNumber === 2)),
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

    const { slots, scheduleWeeks } = activity.schedules[0]

    const allocationSlots = activitySlotsMinusExclusions(allocation.exclusions, slots)
    const dailySlots = sessionSlotsToSchedule(scheduleWeeks, allocationSlots)

    const currentWeek = calcCurrentWeek(parseDate(activity.startDate), scheduleWeeks)

    const twoWeekSchedule = scheduleWeeks === 2

    const isStarted = new Date(allocation.startDate) <= new Date()

    const latestScheduleChanges = buildScheduleChangeViewModel(
      allocation.allocatedTime,
      exclusionHistory,
      allocation.scheduleLastChanged,
    )

    const userIds = [
      allocation.plannedSuspension?.plannedBy,
      allocation.allocatedBy,
      latestScheduleChanges.week1?.changedBy,
      latestScheduleChanges.week2?.changedBy,
    ].filter(Boolean)

    let userMap = new Map()

    try {
      userMap = await this.userService.getUserMap([...new Set(userIds)], user)
    } catch {
      logger.info('Failed to load one or more users')
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
      latestScheduleChanges,
      suspensionCaseNote,
      activityIsPaid: activity?.paid,
      twoWeekSchedule,
    })
  }
}
