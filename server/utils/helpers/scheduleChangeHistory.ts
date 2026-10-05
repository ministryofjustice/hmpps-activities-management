import { ExclusionRevision, ScheduleLastChanged, ActivityScheduleSlot } from '../../@types/activitiesAPI/types'
import { getFullDayFromAbbreviation } from './activityTimeSlotMappers'

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

export type ChangeEvent = ExclusionChangeEvent | ScheduleChangeEvent

export type ScheduleChangeHistory = {
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
    addedToSchedule: groupSessionsByDay(history.addedSessions),
    removedFromSchedule: groupSessionsByDay(history.removedSessions),
  }))
}

const groupSessionsByDay = (
  sessions: {
    weekNumber: number
    dayOfWeek: string
    timeSlot: string
  }[],
): ScheduleDisplayItem[] => {
  const grouped = new Map<string, ScheduleDisplayItem>()

  sessions.forEach(session => {
    const key = `${session.weekNumber}-${session.dayOfWeek}`

    if (!grouped.has(key)) {
      grouped.set(key, {
        weekNumber: session.weekNumber,
        dayOfWeek: session.dayOfWeek,
        timeSlots: [],
      })
    }

    grouped.get(key)!.timeSlots.push(session.timeSlot)
  })

  return [...grouped.values()]
}

const exclusionSessionExistsInActivitySchedule = (
  activitySlots: ActivityScheduleSlot[],
  exclusionEvent: ScheduleDisplayItem,
): boolean => {
  return activitySlots.some(
    slot =>
      slot.weekNumber === exclusionEvent.weekNumber &&
      exclusionEvent.timeSlots.includes(slot.timeSlot) &&
      slot.daysOfWeek.some(day => getFullDayFromAbbreviation(day) === exclusionEvent.dayOfWeek),
  )
}

const filterInvalidExclusionEvents = (
  event: ChangeEvent,
  activitySlots: ActivityScheduleSlot[],
): ChangeEvent | null => {
  if (event.type !== 'EXCLUSION' || !event.addedToSchedule.length) {
    return event
  }

  const addedToSchedule = event.addedToSchedule
    .map(exclusionEvent => ({
      ...exclusionEvent,
      timeSlots: exclusionEvent.timeSlots.filter(timeSlot =>
        exclusionSessionExistsInActivitySchedule(activitySlots, {
          ...exclusionEvent,
          timeSlots: [timeSlot],
        }),
      ),
    }))
    .filter(exclusionEvent => exclusionEvent.timeSlots.length > 0)

  if (!addedToSchedule.length && !event.removedFromSchedule.length) {
    return null
  }

  return {
    ...event,
    addedToSchedule,
  }
}

const getLatestForWeek = (events: ChangeEvent[]): ChangeEvent | null => {
  if (!events.length) {
    return null
  }

  return events.reduce((latest, current) => (current.changedAt > latest.changedAt ? current : latest))
}

const buildLatestEventsByWeek = (events: ChangeEvent[]): ScheduleChangeHistory => ({
  week1: getLatestForWeek(events.filter(event => event.weekNumber === 1)),
  week2: getLatestForWeek(events.filter(event => event.weekNumber === 2)),
})

export const buildScheduleChangeViewModel = (
  allocatedTime: string | null | undefined,
  exclusionHistory: ExclusionRevision[],
  scheduleHistory: ScheduleLastChanged[],
  activitySlots: ActivityScheduleSlot[],
): ScheduleChangeHistory => {
  const events = [...mapExclusionHistoryToEvents(exclusionHistory), ...mapScheduleHistoryToEvents(scheduleHistory)]

  const relevantEvents = allocatedTime ? events.filter(event => event.changedAt > allocatedTime) : events

  const visibleEvents = relevantEvents
    .map(event => filterInvalidExclusionEvents(event, activitySlots))
    .filter((event): event is ChangeEvent => event !== null)

  return buildLatestEventsByWeek(visibleEvents)
}
