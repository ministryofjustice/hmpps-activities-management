import TimeSlot from '../../enum/timeSlot'
import { Slots } from '../../routes/activities/create-an-activity/journey'
import { ActivityScheduleSlot, Slot } from '../../@types/activitiesAPI/types'
import { getTimeSlotFromTime } from '../utils'

interface DailyTimeSlots {
  [weekNumber: string]: {
    day: string
    slots: TimeSlot[]
  }[]
}

type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

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
  const dailySlots: DailyTimeSlots = {}
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
    timeSlot: getTimeSlotFromTime(input.startTime).toUpperCase(),
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
