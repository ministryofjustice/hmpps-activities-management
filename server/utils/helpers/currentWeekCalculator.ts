import { differenceInDays, subDays } from 'date-fns'

export default function calcCurrentWeek(startDate: Date, scheduleWeeks: number) {
  // Current week only applies if the activity has started
  if (startDate > new Date()) return null

  /* The schedule starts on the Monday on or before the activity start date,
   * so find this date and calculate the number of days from then to resolve
   * which week number a particular date falls into */
  const daysInWeek = 7
  const dayOfWeek = (sundayIndexedDay => {
    if (sundayIndexedDay - 1 < 0) return 6
    return sundayIndexedDay - 1
  })(startDate.getDay())
  const scheduleFirstMonday = subDays(startDate, dayOfWeek)
  const daysIntoSchedule = differenceInDays(new Date(), scheduleFirstMonday)
  const daysIntoThisSchedulePeriod = daysIntoSchedule % (daysInWeek * scheduleWeeks)
  return Math.floor(daysIntoThisSchedulePeriod / daysInWeek) + 1
}
