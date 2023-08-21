import TimeSlot from '../../enum/timeSlot'
import { Slots } from '../../routes/activities/create-an-activity/journey'

interface DailyTimeSlots {
  [weekNumber: string]: {
    day: string
    slots: TimeSlot[]
  }[]
}

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
  const weeklySlots: DailyTimeSlots = {}
  for (let weekNumber = 1; weekNumber <= scheduleWeeks; weekNumber += 1) {
    const slots = scheduleSlots[weekNumber] ?? {}

    weeklySlots[weekNumber] = daysOfWeek.map(day => ({
      day,
      slots: (slots[`timeSlots${day}`] as string[])
        ?.map(timeslot => toTimeSlot(timeslot))
        ?.sort((a, b) => timeSlotOrder[a] - timeSlotOrder[b]),
    }))
  }
  return weeklySlots
}
