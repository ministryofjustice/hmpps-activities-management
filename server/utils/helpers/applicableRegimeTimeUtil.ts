import { PrisonRegime } from '../../data/activitiesApiClient'
import { convertToTitleCase } from '../utils'

type DaysAndSlotsInRegime = {
  dayOfWeek: string
  amStart?: string
  amFinish?: string
  pmStart?: string
  pmFinish?: string
  edStart?: string
  edFinish?: string
}

export type ActivityDaysAndSlots = {
  days: string[]
  timeSlotsMonday: string[]
  timeSlotsTuesday: string[]
  timeSlotsWednesday: string[]
  timeSlotsThursday: string[]
  timeSlotsFriday: string[]
  timeSlotsSaturday: string[]
  timeSlotsSunday: string[]
}

export default function getApplicableDaysAndSlotsInRegime(
  regimeTimes: PrisonRegime[],
  daysAndSlots: ActivityDaysAndSlots,
) {
  return daysAndSlots.days
    .map((day: string) => {
      const dayUpper: string = day.toUpperCase()
      const dayTitle: string = convertToTitleCase(day)
      const daySchedule = regimeTimes.find(schedule => schedule.dayOfWeek === dayUpper)

      if (!daySchedule) return null

      const applicableSlotsForDay = daysAndSlots[`timeSlots${dayTitle}`]
      const dayObject: DaysAndSlotsInRegime = { dayOfWeek: dayUpper }

      if (applicableSlotsForDay.includes('AM')) {
        dayObject.amStart = daySchedule.amStart
        dayObject.amFinish = daySchedule.amFinish
      }
      if (applicableSlotsForDay.includes('PM')) {
        dayObject.pmStart = daySchedule.pmStart
        dayObject.pmFinish = daySchedule.pmFinish
      }
      if (applicableSlotsForDay.includes('ED')) {
        dayObject.edStart = daySchedule.edStart
        dayObject.edFinish = daySchedule.edFinish
      }

      return dayObject
    })
    .filter((dayObject: null) => dayObject !== null)
}
