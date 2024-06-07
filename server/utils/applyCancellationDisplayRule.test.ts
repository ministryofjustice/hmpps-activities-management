import { subDays, subMonths, subWeeks } from 'date-fns'
import { ScheduledEvent } from '../@types/activitiesAPI/types'
import { AppointmentFrequency } from '../@types/appointments'
import { toDateString } from './utils'
import applyCancellationDisplayRule from './applyCancellationDisplayRule'

describe('Unlock list service', () => {
  describe('cancelled appointment unlock list filters', () => {
    it('should not show daily appointment more than 1 days before the appointment date', async () => {
      const appointmentDate = subDays(new Date(), 2)
      const twoDaysBefore = subDays(new Date(), 4)
      const appointment: ScheduledEvent = {
        autoSuspended: false,
        cancelled: true,
        inCell: false,
        offWing: false,
        onWing: false,
        outsidePrison: false,
        priority: 0,
        startTime: '',
        suspended: false,
        date: toDateString(appointmentDate),
        appointmentSeriesFrequency: AppointmentFrequency.DAILY,
        appointmentSeriesCancellationStartDate: toDateString(twoDaysBefore),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(false)
    })

    it('should show daily appointment that is 1 day before the appointment date', async () => {
      const appointmentDate = subDays(new Date(), 2)
      const oneDaysBefore = subDays(new Date(), 3)
      const appointment: ScheduledEvent = {
        autoSuspended: false,
        cancelled: true,
        inCell: false,
        offWing: false,
        onWing: false,
        outsidePrison: false,
        priority: 0,
        startTime: '',
        suspended: false,
        date: toDateString(appointmentDate),
        appointmentSeriesFrequency: AppointmentFrequency.DAILY,
        appointmentSeriesCancellationStartDate: toDateString(oneDaysBefore),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(true)
    })

    it('should not show weekday appointment more than 3 days before the appointment date', async () => {
      const appointmentDate = subDays(new Date(), 2)
      const fourDaysAgo = subDays(new Date(), 6)
      const appointment: ScheduledEvent = {
        autoSuspended: false,
        cancelled: true,
        inCell: false,
        offWing: false,
        onWing: false,
        outsidePrison: false,
        priority: 0,
        startTime: '',
        suspended: false,
        date: toDateString(appointmentDate),
        appointmentSeriesFrequency: AppointmentFrequency.WEEKDAY,
        appointmentSeriesCancellationStartDate: toDateString(fourDaysAgo),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(false)
    })

    it('should show weekday appointment that is 3 days before the appointment date', async () => {
      const appointmentDate = subDays(new Date(), 2)
      const threeDaysBefore = subDays(new Date(), 5)
      const appointment: ScheduledEvent = {
        autoSuspended: false,
        cancelled: true,
        inCell: false,
        offWing: false,
        onWing: false,
        outsidePrison: false,
        priority: 0,
        startTime: '',
        suspended: false,
        date: toDateString(appointmentDate),
        appointmentSeriesFrequency: AppointmentFrequency.WEEKDAY,
        appointmentSeriesCancellationStartDate: toDateString(threeDaysBefore),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(true)
    })

    it('should not show weekly appointment more than 1 week before the appointment date', async () => {
      const appointmentDate = subDays(new Date(), 2)
      const eightDaysBefore = subDays(new Date(), 10)
      const appointment: ScheduledEvent = {
        autoSuspended: false,
        cancelled: true,
        inCell: false,
        offWing: false,
        onWing: false,
        outsidePrison: false,
        priority: 0,
        startTime: '',
        suspended: false,
        date: toDateString(appointmentDate),
        appointmentSeriesFrequency: AppointmentFrequency.WEEKLY,
        appointmentSeriesCancellationStartDate: toDateString(eightDaysBefore),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(false)
    })

    it('should show weekly appointment that is 1 week before the appointment date', async () => {
      const appointmentDate = subDays(new Date(), 2)
      const oneWeekBefore = subDays(subWeeks(new Date(), 1), 2)
      const appointment: ScheduledEvent = {
        autoSuspended: false,
        cancelled: true,
        inCell: false,
        offWing: false,
        onWing: false,
        outsidePrison: false,
        priority: 0,
        startTime: '',
        suspended: false,
        date: toDateString(appointmentDate),
        appointmentSeriesFrequency: AppointmentFrequency.WEEKLY,
        appointmentSeriesCancellationStartDate: toDateString(oneWeekBefore),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(true)
    })

    it('should not show fortnightly appointment more than 2 weeks before the appointment date', async () => {
      const appointmentDate = subDays(new Date(), 2)
      const fifteenDaysBefore = subDays(new Date(), 17)
      const appointment: ScheduledEvent = {
        autoSuspended: false,
        cancelled: true,
        inCell: false,
        offWing: false,
        onWing: false,
        outsidePrison: false,
        priority: 0,
        startTime: '',
        suspended: false,
        date: toDateString(appointmentDate),
        appointmentSeriesFrequency: AppointmentFrequency.FORTNIGHTLY,
        appointmentSeriesCancellationStartDate: toDateString(fifteenDaysBefore),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(false)
    })

    it('should show fortnightly appointment that is 2 weeks before the appointment date', async () => {
      const appointmentDate = subDays(new Date(), 2)
      const twoWeeksBefore = subDays(subWeeks(new Date(), 2), 2)
      const appointment: ScheduledEvent = {
        autoSuspended: false,
        cancelled: true,
        inCell: false,
        offWing: false,
        onWing: false,
        outsidePrison: false,
        priority: 0,
        startTime: '',
        suspended: false,
        date: toDateString(appointmentDate),
        appointmentSeriesFrequency: AppointmentFrequency.FORTNIGHTLY,
        appointmentSeriesCancellationStartDate: toDateString(twoWeeksBefore),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(true)
    })

    it('should not show monthly appointment more than 1 month before the appointment date', async () => {
      const appointmentDate = new Date(2023, 7, 31)
      const overOneMonthBefore = subDays(subMonths(appointmentDate, 1), 1)
      const appointment: ScheduledEvent = {
        autoSuspended: false,
        cancelled: true,
        inCell: false,
        offWing: false,
        onWing: false,
        outsidePrison: false,
        priority: 0,
        startTime: '',
        suspended: false,
        date: toDateString(appointmentDate),
        appointmentSeriesFrequency: AppointmentFrequency.MONTHLY,
        appointmentSeriesCancellationStartDate: toDateString(overOneMonthBefore),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(false)
    })

    it('should not show monthly appointment more than 1 month before the appointment date with different month ends', async () => {
      const appointmentDate = new Date(2024, 2, 31)
      const overOneMonthBefore = subDays(subMonths(appointmentDate, 1), 1)
      const appointment: ScheduledEvent = {
        autoSuspended: false,
        cancelled: true,
        inCell: false,
        offWing: false,
        onWing: false,
        outsidePrison: false,
        priority: 0,
        startTime: '',
        suspended: false,
        date: toDateString(appointmentDate),
        appointmentSeriesFrequency: AppointmentFrequency.MONTHLY,
        appointmentSeriesCancellationStartDate: toDateString(overOneMonthBefore),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(false)
    })

    it('should show monthly appointment that is 1 month before the appointment date', async () => {
      const appointmentDate = new Date(2023, 7, 31)
      const oneMonthBefore = subMonths(appointmentDate, 1)
      const appointment: ScheduledEvent = {
        autoSuspended: false,
        cancelled: true,
        inCell: false,
        offWing: false,
        onWing: false,
        outsidePrison: false,
        priority: 0,
        startTime: '',
        suspended: false,
        date: toDateString(appointmentDate),
        appointmentSeriesFrequency: AppointmentFrequency.MONTHLY,
        appointmentSeriesCancellationStartDate: toDateString(oneMonthBefore),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(true)
    })

    it('should show monthly appointment that is 1 month before the appointment date with different month ends', async () => {
      const appointmentDate = new Date(2024, 2, 31)
      const oneMonthBefore = subMonths(appointmentDate, 1)
      const appointment: ScheduledEvent = {
        autoSuspended: false,
        cancelled: true,
        inCell: false,
        offWing: false,
        onWing: false,
        outsidePrison: false,
        priority: 0,
        startTime: '',
        suspended: false,
        date: toDateString(appointmentDate),
        appointmentSeriesFrequency: AppointmentFrequency.MONTHLY,
        appointmentSeriesCancellationStartDate: toDateString(oneMonthBefore),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(true)
    })

    it('should show when not part of an appointment series', async () => {
      const appointmentDate = subDays(new Date(), 2)
      const appointment: ScheduledEvent = {
        autoSuspended: false,
        cancelled: true,
        inCell: false,
        offWing: false,
        onWing: false,
        outsidePrison: false,
        priority: 0,
        startTime: '',
        suspended: false,
        date: toDateString(appointmentDate),
        appointmentSeriesFrequency: AppointmentFrequency.DAILY,
        appointmentSeriesCancellationStartDate: null,
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(true)

      const twoDaysAgo = subDays(new Date(), 2)
      const appointment2: ScheduledEvent = {
        autoSuspended: false,
        cancelled: true,
        inCell: false,
        offWing: false,
        onWing: false,
        outsidePrison: false,
        priority: 0,
        startTime: '',
        suspended: false,
        date: toDateString(appointmentDate),
        appointmentSeriesFrequency: null,
        appointmentSeriesCancellationStartDate: toDateString(twoDaysAgo),
      }
      const showAppointment2 = applyCancellationDisplayRule(appointment2)
      expect(showAppointment2).toEqual(true)
    })
  })
})
