import { uniq } from 'lodash'
import TimeSlot from '../../enum/timeSlot'
import { Slots } from '../../routes/activities/create-an-activity/journey'
import { ActivityScheduleSlot, Slot } from '../../@types/activitiesAPI/types'
import { getTimeSlotFromTime } from '../utils'

export interface WeeklyTimeSlots {
  [weekNumber: string]: {
    day: string
    slots: TimeSlot[]
  }[]
}

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const timeSlotOrder = {
  [TimeSlot.AM]: 0,
  [TimeSlot.PM]: 1,
  [TimeSlot.ED]: 2,
}

const toTimeSlot = (timeSlot: string): TimeSlot => TimeSlot[timeSlot]

export default function activitySessionToDailyTimeSlots(
  scheduleWeeks: number,
  scheduleSlots: { [weekNumber: string]: Slots },
) {
  const dailySlots: WeeklyTimeSlots = {}
  for (let weekNumber = 1; weekNumber <= scheduleWeeks; weekNumber += 1) {
    const slots = scheduleSlots[weekNumber] ?? {}

    dailySlots[weekNumber] = daysOfWeek.map(day => ({
      day,
      slots:
        (slots[`timeSlots${day}`] as string[])
          ?.map(timeslot => toTimeSlot(timeslot))
          ?.sort((a, b) => timeSlotOrder[a] - timeSlotOrder[b]) || [],
    }))
  }
  return dailySlots
}

export function mapActivityScheduleSlotsToSlots(activityScheduleSlot: ActivityScheduleSlot[]): Slot[] {
  const mapToDaysOfWeekEnum = (d: string[]): DayOfWeek[] => d.map(day => getFullDayFromAbbreviation(day))

  return activityScheduleSlot.map(input => ({
    weekNumber: input.weekNumber,
    timeSlot: TimeSlot[getTimeSlotFromTime(input.startTime)],
    monday: input.mondayFlag,
    tuesday: input.tuesdayFlag,
    wednesday: input.wednesdayFlag,
    thursday: input.thursdayFlag,
    friday: input.fridayFlag,
    saturday: input.saturdayFlag,
    sunday: input.sundayFlag,
    daysOfWeek: mapToDaysOfWeekEnum(input.daysOfWeek),
  }))
}

export function activitySlotsMinusExclusions(
  exclusions: Slot[],
  activitySlots: ActivityScheduleSlot[],
): ActivityScheduleSlot[] {
  return activitySlots.map(s => {
    const exclusion = exclusions.find(
      e => e.weekNumber === s.weekNumber && e.timeSlot === getTimeSlotFromTime(s.startTime).toString().toUpperCase(),
    )

    return exclusion
      ? {
          ...s,
          mondayFlag: s.mondayFlag && !exclusion.monday,
          tuesdayFlag: s.tuesdayFlag && !exclusion.tuesday,
          wednesdayFlag: s.wednesdayFlag && !exclusion.wednesday,
          thursdayFlag: s.thursdayFlag && !exclusion.thursday,
          fridayFlag: s.fridayFlag && !exclusion.friday,
          saturdayFlag: s.saturdayFlag && !exclusion.saturday,
          sundayFlag: s.sundayFlag && !exclusion.sunday,
          daysOfWeek: s.daysOfWeek.filter(d => !exclusion.daysOfWeek.includes(getFullDayFromAbbreviation(d))),
        }
      : s
  })
}

const getFullDayFromAbbreviation = (abbrDay: string): DayOfWeek => {
  const daysMap: { [abbr: string]: string } = {
    Mon: 'MONDAY',
    Tue: 'TUESDAY',
    Wed: 'WEDNESDAY',
    Thu: 'THURSDAY',
    Fri: 'FRIDAY',
    Sat: 'SATURDAY',
    Sun: 'SUNDAY',
  }

  return daysMap[abbrDay] as DayOfWeek
}

export function mapSlotsToWeeklyTimeSlots(slots: Slot[]): WeeklyTimeSlots {
  return uniq(slots.map(s => s.weekNumber)).reduce(
    (acc, weekNumber) => ({
      ...acc,
      [weekNumber]: daysOfWeek
        .map(d => d.toUpperCase())
        .map(day => {
          const timeSlots = slots
            .filter(slot => slot.weekNumber === weekNumber)
            .filter(s => (s.daysOfWeek as string[]).includes(day))
            .map(slot => slot.timeSlot as TimeSlot)

          if (timeSlots.length === 0) return null
          return {
            day,
            slots: timeSlots,
          }
        })
        .filter(a => a),
    }),
    {},
  )
}

// Similar to mapSlotsToWeeklyTimeSlots, but includes empty weeks and days only excluding days without any slots
// across schedule
export function mapSlotsToCompleteWeeklyTimeSlots(slots: Slot[], scheduledWeeks: number): WeeklyTimeSlots {
  return [...Array(scheduledWeeks).keys()]
    .map(v => v + 1)
    .reduce(
      (acc, weekNumber) => ({
        ...acc,
        [weekNumber]: daysOfWeek
          .map(d => d.toUpperCase())
          .map(day => {
            const timeSlots = slots
              .filter(slot => slot.weekNumber === weekNumber)
              .filter(s => (s.daysOfWeek as string[]).includes(day))
              .map(slot => slot.timeSlot as TimeSlot)

            if (timeSlots.length === 0 && !slots.find(s => s.daysOfWeek.includes(day as DayOfWeek))) return null
            return {
              day,
              slots: timeSlots,
            }
          })
          .filter(a => a),
      }),
      {},
    )
}

export function calculateUniqueSlots(slotsA: Slot[], slotsB: Slot[]): Slot[] {
  return slotsA
    .map(slot => {
      const updatedSlot = slotsB.find(us => us.weekNumber === slot.weekNumber && us.timeSlot === slot.timeSlot)
      return updatedSlot
        ? {
            ...slot,
            monday: slot.monday && !updatedSlot.monday,
            tuesday: slot.tuesday && !updatedSlot.tuesday,
            wednesday: slot.wednesday && !updatedSlot.wednesday,
            thursday: slot.thursday && !updatedSlot.thursday,
            friday: slot.friday && !updatedSlot.friday,
            saturday: slot.saturday && !updatedSlot.saturday,
            sunday: slot.sunday && !updatedSlot.sunday,
            daysOfWeek: slot.daysOfWeek.filter(d => !updatedSlot.daysOfWeek.includes(d)),
          }
        : slot
    })
    .filter(s => s.daysOfWeek.length > 0)
}
