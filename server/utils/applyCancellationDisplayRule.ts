import { subDays, subMonths, subWeeks } from 'date-fns'
import { ScheduledEvent } from '../@types/activitiesAPI/types'
import { AppointmentFrequency } from '../@types/appointments'
import { toDate } from './utils'

export default function applyCancellationDisplayRule(app: ScheduledEvent): boolean {
  let showAppointment = true
  const appointmentDate = toDate(app.date)
  if (app.cancelled && app.appointmentSeriesCancellationStartDate && app.appointmentSeriesFrequency) {
    if (
      app.appointmentSeriesFrequency === AppointmentFrequency.DAILY &&
      toDate(app.appointmentSeriesCancellationStartDate) < subDays(appointmentDate, 1)
    ) {
      showAppointment = false
    } else if (
      app.appointmentSeriesFrequency === AppointmentFrequency.WEEKDAY &&
      toDate(app.appointmentSeriesCancellationStartDate) < subDays(appointmentDate, 3)
    ) {
      showAppointment = false
    } else if (
      app.appointmentSeriesFrequency === AppointmentFrequency.WEEKLY &&
      toDate(app.appointmentSeriesCancellationStartDate) < subWeeks(appointmentDate, 1)
    ) {
      showAppointment = false
    } else if (
      app.appointmentSeriesFrequency === AppointmentFrequency.FORTNIGHTLY &&
      toDate(app.appointmentSeriesCancellationStartDate) < subWeeks(appointmentDate, 2)
    ) {
      showAppointment = false
    } else if (
      app.appointmentSeriesFrequency === AppointmentFrequency.MONTHLY &&
      toDate(app.appointmentSeriesCancellationStartDate) < subMonths(appointmentDate, 1)
    ) {
      showAppointment = false
    }
  }
  return showAppointment
}
