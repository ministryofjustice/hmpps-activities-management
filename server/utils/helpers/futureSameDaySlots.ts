import { parseDate, getTodayAsDayOfTheWeek, isSlotTimeInFuture } from '../utils'
import calcCurrentWeek from './currentWeekCalculator'
import { ActivitySchedule, Slot, PrisonRegime } from '../../@types/activitiesAPI/types'

const REGIME_TIME_MAP = {
  AM: 'amStart',
  PM: 'pmStart',
  ED: 'edStart',
} as const

function getRegimeStartTime(regime: PrisonRegime, timeSlot: string): string | undefined {
  const key = REGIME_TIME_MAP[timeSlot as keyof typeof REGIME_TIME_MAP]
  return key ? regime[key] : undefined
}

/**
 * Filters for slots that occur later today, provided this week is the current week of the schedule
 * Multi-week schedules are handled by only returning slots from the current week,
 * preventing future week slots from triggering the same-day redirect.
 * Keep all slot properties, but filter daysOfWeek to only today. e.g ['THURSDAY', 'FRIDAY'] becomes ['FRIDAY']
 * Slots will include a startTime property if using a prisons regime time, otherwise customStartTime is used.
 * @param addedSlots The slots that were changed
 * @param schedule The activity schedule containing slots and metadata
 * @param regimeTimes Optional prison regime times to look up start times for new slots
 * @returns Array of slots occurring today with future start times in the current week
 */
export default function getFutureSameDaySlots(
  addedSlots: Slot[],
  schedule: ActivitySchedule,
  regimeTimes?: PrisonRegime[],
): Slot[] {
  const todayAsDayOfTheWeek = getTodayAsDayOfTheWeek()

  const currentWeekNumber = calcCurrentWeek(parseDate(schedule.startDate), schedule.scheduleWeeks)
  const weekToCheck = currentWeekNumber ?? 1

  return addedSlots
    .filter(slot => {
      if (slot.weekNumber !== weekToCheck) return false

      let slotStartTime = slot.customStartTime

      // If no custom start time, use regime time
      if (!slotStartTime) {
        const regimeForToday = regimeTimes.find(r => r.dayOfWeek === todayAsDayOfTheWeek)
        slotStartTime = regimeForToday && getRegimeStartTime(regimeForToday, slot.timeSlot)
      }

      return slot.daysOfWeek.includes(todayAsDayOfTheWeek) && !!slotStartTime && isSlotTimeInFuture(slotStartTime)
    })

    .map(slot => ({
      ...slot,
      daysOfWeek: slot.daysOfWeek.filter(day => day === todayAsDayOfTheWeek),
    }))
}

/**
 * Filters for ALL slots that occur today (both past and future), provided this week is the current week of the schedule
 * @param addedSlots The slots that were changed
 * @param schedule The activity schedule containing slots and metadata
 * @returns Array of all slots occurring today in the current week
 */
export function getAllSameDaySlots(addedSlots: Slot[], schedule: ActivitySchedule): Slot[] {
  const todayAsDayOfTheWeek = getTodayAsDayOfTheWeek()

  const currentWeekNumber = calcCurrentWeek(parseDate(schedule.startDate), schedule.scheduleWeeks)
  const weekToCheck = currentWeekNumber ?? 1

  return addedSlots
    .filter(slot => slot.weekNumber === weekToCheck && slot.daysOfWeek.includes(todayAsDayOfTheWeek))

    .map(slot => ({
      ...slot,
      daysOfWeek: slot.daysOfWeek.filter(day => day === todayAsDayOfTheWeek),
    }))
}
