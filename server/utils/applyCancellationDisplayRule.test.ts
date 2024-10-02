import { subDays, subMonths, subWeeks } from 'date-fns'
import { ScheduledEvent } from '../@types/activitiesAPI/types'
import { AppointmentFrequency } from '../@types/appointments'
import { toDateString } from './utils'
import applyCancellationDisplayRule from './applyCancellationDisplayRule'

describe('Unlock list service', () => {
  describe('cancelled appointment unlock list filters', () => {
    let appointment: ScheduledEvent

    beforeEach(() => {
      appointment = {
        autoSuspended: false,
        cancelled: true,
        inCell: false,
        offWing: false,
        onWing: false,
        outsidePrison: false,
        priority: 0,
        startTime: '',
        suspended: false,
        date: toDateString(subDays(new Date(), 2)),
        appointmentSeriesFrequency: AppointmentFrequency.DAILY,
        appointmentSeriesCancellationStartDate: toDateString(subDays(new Date(), 4)),
        paidActivity: null,
        issuePayment: null,
        attendanceStatus: null,
        attendanceReasonCode: null,
      }
    })

    it('should not show daily appointment more than 1 days before the appointment date', async () => {
      appointment.appointmentSeriesCancellationStartDate = toDateString(subDays(new Date(), 4))

      const showAppointment = applyCancellationDisplayRule(appointment)

      expect(showAppointment).toEqual(false)
    })

    it('should show daily appointment that is 1 day before the appointment date', async () => {
      appointment.appointmentSeriesCancellationStartDate = toDateString(subDays(new Date(), 3))

      const showAppointment = applyCancellationDisplayRule(appointment)

      expect(showAppointment).toEqual(true)
    })

    it('should not show weekday appointment more than 3 days before the appointment date', async () => {
      appointment.appointmentSeriesCancellationStartDate = toDateString(subDays(new Date(), 6))

      const showAppointment = applyCancellationDisplayRule(appointment)

      expect(showAppointment).toEqual(false)
    })

    it('should show weekday appointment that is 3 days before the appointment date', async () => {
      appointment.appointmentSeriesCancellationStartDate = toDateString(subDays(new Date(), 5))
      appointment.appointmentSeriesFrequency = AppointmentFrequency.WEEKDAY

      const showAppointment = applyCancellationDisplayRule(appointment)

      expect(showAppointment).toEqual(true)
    })

    it('should not show weekly appointment more than 1 week before the appointment date', async () => {
      appointment.appointmentSeriesCancellationStartDate = toDateString(subDays(new Date(), 10))

      const showAppointment = applyCancellationDisplayRule(appointment)

      expect(showAppointment).toEqual(false)
    })

    it('should show weekly appointment that is 1 week before the appointment date', async () => {
      appointment.appointmentSeriesCancellationStartDate = toDateString(subDays(subWeeks(new Date(), 1), 2))
      appointment.appointmentSeriesFrequency = AppointmentFrequency.WEEKLY

      const showAppointment = applyCancellationDisplayRule(appointment)

      expect(showAppointment).toEqual(true)
    })

    it('should not show fortnightly appointment more than 2 weeks before the appointment date', async () => {
      appointment.appointmentSeriesCancellationStartDate = toDateString(subDays(new Date(), 17))

      const showAppointment = applyCancellationDisplayRule(appointment)

      expect(showAppointment).toEqual(false)
    })

    it('should show fortnightly appointment that is 2 weeks before the appointment date', async () => {
      appointment.appointmentSeriesCancellationStartDate = toDateString(subDays(subWeeks(new Date(), 2), 2))
      appointment.appointmentSeriesFrequency = AppointmentFrequency.FORTNIGHTLY

      const showAppointment = applyCancellationDisplayRule(appointment)

      expect(showAppointment).toEqual(true)
    })

    it('should not show monthly appointment more than 1 month before the appointment date', async () => {
      const appointmentDate = new Date(2023, 7, 31)
      appointment.date = toDateString(appointmentDate)
      appointment.appointmentSeriesCancellationStartDate = toDateString(subDays(subMonths(appointmentDate, 1), 1))

      const showAppointment = applyCancellationDisplayRule(appointment)

      expect(showAppointment).toEqual(false)
    })

    it('should not show monthly appointment more than 1 month before the appointment date with different month ends', async () => {
      const appointmentDate = new Date(2024, 7, 31)
      appointment.date = toDateString(appointmentDate)
      appointment.appointmentSeriesCancellationStartDate = toDateString(subDays(subMonths(appointmentDate, 1), 1))

      const showAppointment = applyCancellationDisplayRule(appointment)

      expect(showAppointment).toEqual(false)
    })

    it('should show monthly appointment that is 1 month before the appointment date', async () => {
      const appointmentDate = new Date(2023, 7, 31)
      appointment.date = toDateString(appointmentDate)
      appointment.appointmentSeriesCancellationStartDate = toDateString(subMonths(appointmentDate, 1))
      appointment.appointmentSeriesFrequency = AppointmentFrequency.MONTHLY

      const showAppointment = applyCancellationDisplayRule(appointment)

      expect(showAppointment).toEqual(true)
    })

    it('should show monthly appointment that is 1 month before the appointment date with different month ends', async () => {
      const appointmentDate = new Date(2024, 2, 31)
      appointment.date = toDateString(appointmentDate)
      appointment.appointmentSeriesCancellationStartDate = toDateString(subMonths(appointmentDate, 1))
      appointment.appointmentSeriesFrequency = AppointmentFrequency.MONTHLY

      const showAppointment = applyCancellationDisplayRule(appointment)

      expect(showAppointment).toEqual(true)
    })

    it('should show when not part of an appointment series', async () => {
      appointment.date = toDateString(new Date(2024, 2, 31))
      appointment.appointmentSeriesCancellationStartDate = null

      const showAppointment = applyCancellationDisplayRule(appointment)

      expect(showAppointment).toEqual(true)

      appointment.appointmentSeriesCancellationStartDate = toDateString(subDays(new Date(), 2))

      const showAppointment2 = applyCancellationDisplayRule(appointment)

      expect(showAppointment2).toEqual(true)
    })
  })
})
