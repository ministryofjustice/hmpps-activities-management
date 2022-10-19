import { compareAsc, eachDayOfInterval, endOfMonth, endOfWeek, isSameDay, startOfMonth, startOfWeek } from 'date-fns'
import CalendarView from '../enum/calendarView'

function getCalendarConfig(referenceDate: Date, calendarView = CalendarView.WEEKLY) {
  let days: Date[]
  switch (calendarView) {
    case CalendarView.WEEKLY:
      days = eachDayOfInterval({ start: startOfWeek(referenceDate), end: endOfWeek(referenceDate) })
      break
    case CalendarView.MONTHLY:
      days = eachDayOfInterval({ start: startOfMonth(referenceDate), end: endOfMonth(referenceDate) })
      break
    default:
      throw new Error('Illegal Argument: Unexpected value passed for calendarView')
  }

  return days
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// This type doesnt exist yet - dummy for spike's sake
function filterActivitiesForDay(activities: any[], day: Date) {
  return activities.filter(activity => isSameDay(activity.start, day))
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// This type doesnt exist yet - dummy for spike's sake
function sortActivitiesByStartTime(activities: any[]) {
  return activities.sort((a, b) => compareAsc(a.start, b.start))
}

export { getCalendarConfig, filterActivitiesForDay, sortActivitiesByStartTime }
