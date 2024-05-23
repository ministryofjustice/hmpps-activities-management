import { subDays, subMonths, subWeeks } from 'date-fns'
import { ScheduledEvent } from '../@types/activitiesAPI/types'
import { AppointmentFrequency } from '../@types/appointments'
import { toDate } from './utils'

export default function applyCancellationDisplayRule(app: ScheduledEvent): boolean {
  let showAppointment = true
  const beginningOfToday = new Date().setHours(0, 0, 0, 0)
  if (app.cancelled) {
    if (
      app.appointmentSeriesFrequency === AppointmentFrequency.DAILY &&
      toDate(app.appointmentSeriesCancellationStartDate) < subDays(beginningOfToday, 2)
    ) {
      showAppointment = false
    } else if (
      app.appointmentSeriesFrequency === AppointmentFrequency.WEEKDAY &&
      toDate(app.appointmentSeriesCancellationStartDate) < subDays(beginningOfToday, 4)
    ) {
      showAppointment = false
    } else if (
      app.appointmentSeriesFrequency === AppointmentFrequency.WEEKLY &&
      toDate(app.appointmentSeriesCancellationStartDate) < subWeeks(beginningOfToday, 2)
    ) {
      showAppointment = false
    } else if (
      app.appointmentSeriesFrequency === AppointmentFrequency.FORTNIGHTLY &&
      toDate(app.appointmentSeriesCancellationStartDate) < subWeeks(beginningOfToday, 4)
    ) {
      showAppointment = false
    } else if (
      app.appointmentSeriesFrequency === AppointmentFrequency.MONTHLY &&
      toDate(app.appointmentSeriesCancellationStartDate) < subMonths(beginningOfToday, 2)
    ) {
      showAppointment = false
    }
  }
  return showAppointment
}
