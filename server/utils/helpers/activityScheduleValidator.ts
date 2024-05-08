import { addDays, differenceInCalendarDays, startOfDay, subDays } from 'date-fns'
import { CreateAnActivityJourney } from '../../routes/activities/create-an-activity/journey'
import { parseIsoDate } from '../datePickerUtils'

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export type ActivityTimeSlotValidationError = {
  weekNumber: number
  day: string
}

function validateChanges(
  journey: CreateAnActivityJourney,
  activityStartDate: Date,
  activityEndDate: Date,
  weekNumber?: number,
): ActivityTimeSlotValidationError[] {
  const { scheduleWeeks } = journey

  const errors: ActivityTimeSlotValidationError[] = []

  if (!activityEndDate || differenceInCalendarDays(activityStartDate, activityEndDate) >= scheduleWeeks * 7) {
    return errors
  }

  const activityStartDayOfWeek = (activityStartDate.getDay() + 6) % 7

  const slots = journey.slots[weekNumber]

  slots.days.forEach(day => {
    const dayOfWeek = daysOfWeek.findIndex(d => d.toLowerCase() === day)

    let slotDate = addDays(activityStartDate, dayOfWeek - activityStartDayOfWeek)

    if (weekNumber > 1) {
      slotDate = addDays(slotDate, 7 * (weekNumber - 1))
    } else if (dayOfWeek < activityStartDayOfWeek) {
      slotDate = addDays(slotDate, 7 * scheduleWeeks)
    }

    if (slotDate > activityEndDate) {
      errors.push({
        weekNumber,
        day: daysOfWeek[dayOfWeek],
      })
    }
  })

  return errors
}

export function validateSlotChanges(journey: CreateAnActivityJourney, weekNumber?: number) {
  const { startDate, endDate } = journey

  const activityStartDate = parseIsoDate(startDate)
  const activityEndDate = parseIsoDate(endDate)

  return validateChanges(journey, activityStartDate, activityEndDate, weekNumber)
}

function isDateRangeValid(journey: CreateAnActivityJourney, activityStartDate: Date, activityEndDate: Date): boolean {
  if (!journey.slots) {
    return true
  }

  return !Object.keys(journey.slots).some(
    weekNumber => validateChanges(journey, activityStartDate, activityEndDate, +weekNumber).length > 0,
  )
}

export function isStartDateValid(journey: CreateAnActivityJourney, newStartDate: Date): boolean {
  const origEndDate = parseIsoDate(journey.endDate)
  const currentStartDate = startOfDay(new Date(newStartDate))

  return isDateRangeValid(journey, currentStartDate, origEndDate)
}

export function isEndDateValid(journey: CreateAnActivityJourney, newEndDate: Date): boolean {
  const origStartDate = parseIsoDate(journey.startDate)
  const currentEndDate = new Date(newEndDate)

  return isDateRangeValid(journey, origStartDate, currentEndDate)
}

export function getNearestInvalidStartDate(journey: CreateAnActivityJourney): Date {
  let currentStartDate = addDays(parseIsoDate(journey.startDate), 1)

  while (isStartDateValid(journey, currentStartDate)) {
    currentStartDate = addDays(currentStartDate, 1)
  }

  return currentStartDate
}

export function getNearestInvalidEndDate(journey: CreateAnActivityJourney): Date {
  let currentEndDate = addDays(parseIsoDate(journey.startDate), journey.scheduleWeeks * 7 - 1)

  while (isEndDateValid(journey, currentEndDate)) {
    currentEndDate = subDays(currentEndDate, 1)
  }

  return currentEndDate
}
