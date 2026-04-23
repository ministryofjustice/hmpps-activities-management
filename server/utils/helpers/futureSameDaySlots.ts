import { parseDate, getTodayAsDayOfTheWeek, isSlotTimeInFuture } from '../utils'
import calcCurrentWeek from './currentWeekCalculator'
import { ActivitySchedule, Slot } from '../../@types/activitiesAPI/types'

/**
 * Filters slots that occur today in the current week and have a start time in the future.
 * Multi-week schedules are handled by only returning slots from the current week,
 * preventing future week slots from triggering the same-day redirect.
 * @param addedSlots The slots that were changed
 * @param schedule The activity schedule containing slots and metadata
 * @returns Array of slots occurring today with future start times in the current week
 */
export default function getFutureSameDaySlots(addedSlots: Slot[], schedule: ActivitySchedule): Slot[] {
  const todayAsDayOfTheWeek = getTodayAsDayOfTheWeek()

  const currentWeekNumber = calcCurrentWeek(parseDate(schedule.startDate), schedule.scheduleWeeks)
  const weekToCheck = currentWeekNumber ?? 1

  return addedSlots.filter(slot => {
    if (slot.weekNumber !== weekToCheck) return false
    if (!slot.daysOfWeek.includes(todayAsDayOfTheWeek)) return false

    const slotStartTime = schedule.slots.find(
      s => s.weekNumber === slot.weekNumber && s.timeSlot === slot.timeSlot,
    )?.startTime

    return !!slotStartTime && isSlotTimeInFuture(slotStartTime)
  })
}
