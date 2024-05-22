import { subDays, subMonths, subWeeks } from 'date-fns'
import { ScheduledEvent } from '../@types/activitiesAPI/types'
import { AppointmentFrequency } from '../@types/appointments'
import { toDate } from './utils'

export default function applyCancellationDisplayRule(app: ScheduledEvent): boolean {
  let showAppointment = true
  const beginingOfToday = new Date().setHours(0, 0, 0, 0)
  if (app.cancelled) {
    if (
      app.appointmentSeriesFrequency === AppointmentFrequency.DAILY &&
      toDate(app.appointmentSeriesCancellationStartDate) < subDays(beginingOfToday, 2)
    ) {
      showAppointment = false
    } else if (
      app.appointmentSeriesFrequency === AppointmentFrequency.WEEKDAY &&
      toDate(app.appointmentSeriesCancellationStartDate) < subDays(beginingOfToday, 4)
    ) {
      showAppointment = false
    } else if (
      app.appointmentSeriesFrequency === AppointmentFrequency.WEEKLY &&
      toDate(app.appointmentSeriesCancellationStartDate) < subWeeks(beginingOfToday, 2)
    ) {
      showAppointment = false
    } else if (
      app.appointmentSeriesFrequency === AppointmentFrequency.FORTNIGHTLY &&
      toDate(app.appointmentSeriesCancellationStartDate) < subWeeks(beginingOfToday, 4)
    ) {
      showAppointment = false
    } else if (
      app.appointmentSeriesFrequency === AppointmentFrequency.MONTHLY &&
      toDate(app.appointmentSeriesCancellationStartDate) < subMonths(beginingOfToday, 2)
    ) {
      showAppointment = false
    }
  }
  return showAppointment
}
