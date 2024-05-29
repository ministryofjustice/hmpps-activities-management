import { subDays, subMonths, subWeeks } from 'date-fns'
import { ScheduledEvent } from '../@types/activitiesAPI/types'
import { AppointmentFrequency } from '../@types/appointments'
import { toDateString } from './utils'
import applyCancellationDisplayRule from './applyCancellationDisplayRule'

describe('Unlock list service', () => {
  describe('cancelled appointment unlock list filters', () => {
    it('should not show daily appointment more than 2 days before the appointment date', async () => {
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
        appointmentSeriesFrequency: AppointmentFrequency.DAILY,
        appointmentSeriesCancellationStartDate: toDateString(threeDaysBefore),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(false)
    })

    it('should show daily appointment that is 2 days before the appointment date', async () => {
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
      expect(showAppointment).toEqual(true)
    })

    it('should not show weekday appointment more than 4 days before the appointment date', async () => {
      const appointmentDate = subDays(new Date(), 2)
      const fiveDaysAgo = subDays(new Date(), 7)
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
        appointmentSeriesCancellationStartDate: toDateString(fiveDaysAgo),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(false)
    })

    it('should show weekday appointment that is 4 days before the appointment date', async () => {
      const appointmentDate = subDays(new Date(), 2)
      const fourDaysBefore = subDays(new Date(), 6)
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
        appointmentSeriesCancellationStartDate: toDateString(fourDaysBefore),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(true)
    })

    it('should not show weekly appointment more than 2 weeks before the appointment date', async () => {
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
        appointmentSeriesFrequency: AppointmentFrequency.WEEKLY,
        appointmentSeriesCancellationStartDate: toDateString(fifteenDaysBefore),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(false)
    })

    it('should show weekly appointment that is 2 weeks before the appointment date', async () => {
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
        appointmentSeriesFrequency: AppointmentFrequency.WEEKLY,
        appointmentSeriesCancellationStartDate: toDateString(twoWeeksBefore),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(true)
    })

    it('should not show fortnightly appointment more than 4 weeks before the appointment date', async () => {
      const appointmentDate = subDays(new Date(), 2)
      const twentyNineDaysBefore = subDays(new Date(), 31)
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
        appointmentSeriesCancellationStartDate: toDateString(twentyNineDaysBefore),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(false)
    })

    it('should show fortnightly appointment that is 4 weeks before the appointment date', async () => {
      const appointmentDate = subDays(new Date(), 2)
      const fourWeeksBefore = subDays(subWeeks(new Date(), 4), 2)
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
        appointmentSeriesCancellationStartDate: toDateString(fourWeeksBefore),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(true)
    })

    it('should not show monthly appointment more than 2 months before the appointment date', async () => {
      const appointmentDate = subDays(new Date(), 2)
      const overTwoMonthsBefore = subDays(subMonths(new Date(), 2), 3)
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
        appointmentSeriesCancellationStartDate: toDateString(overTwoMonthsBefore),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(false)
    })

    it('should show monthly appointment that is 2 months before the appointment date', async () => {
      const appointmentDate = subDays(new Date(), 2)
      const twoMonthsBefore = subDays(subMonths(new Date(), 2), 2)
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
        appointmentSeriesCancellationStartDate: toDateString(twoMonthsBefore),
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
