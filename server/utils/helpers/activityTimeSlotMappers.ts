import { ActivityScheduleSlot } from '../../@types/activitiesAPI/types'
import TimeSlot from '../../enum/timeSlot'
import { CreateAnActivityJourney } from '../../routes/activities/create-an-activity/journey'
import { getTimeSlotFromTime } from '../utils'

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const timeSlotOrder = {
  [TimeSlot.AM]: 0,
  [TimeSlot.PM]: 1,
  [TimeSlot.ED]: 2,
}

const toTimeSlot = (timeSlot: string): TimeSlot => TimeSlot[timeSlot]

export const activitySessionToDailyTimeSlots = (createJourney: CreateAnActivityJourney) =>
  daysOfWeek.map(v => ({
    day: v,
    slots: (createJourney[`timeSlots${v}`] as string[])
      ?.map(timeslot => toTimeSlot(timeslot))
      ?.sort((a, b) => timeSlotOrder[a] - timeSlotOrder[b]),
  }))

export const scheduleSlotsToDailyTimeSlots = (slots: ActivityScheduleSlot[]) =>
  daysOfWeek.map(v => ({
    day: v,
    slots: slots
      .map(slot => {
        if (!slot.daysOfWeek.includes(v.substring(0, 3))) return null
        return getTimeSlotFromTime(slot.startTime)
      })
      .filter(Boolean)
      .sort((a, b) => timeSlotOrder[a] - timeSlotOrder[b]),
  }))
