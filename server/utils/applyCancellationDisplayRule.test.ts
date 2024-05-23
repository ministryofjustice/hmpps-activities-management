import { subDays, subMonths, subWeeks } from 'date-fns'
import { ScheduledEvent } from '../@types/activitiesAPI/types'
import { AppointmentFrequency } from '../@types/appointments'
import { toDateString } from './utils'
import applyCancellationDisplayRule from './applyCancellationDisplayRule'

describe('Unlock list service', () => {
  describe('cancelled appointment unlock list filters', () => {
    it('should not show daily appointment more than 2 days ago', async () => {
      const threeDaysAgo = subDays(new Date(), 3)
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
        appointmentSeriesFrequency: AppointmentFrequency.DAILY,
        appointmentSeriesCancellationStartDate: toDateString(threeDaysAgo),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(false)
    })

    it('should show daily appointment that is 2 days old', async () => {
      const twoDaysAgo = subDays(new Date(), 2)
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
        appointmentSeriesFrequency: AppointmentFrequency.DAILY,
        appointmentSeriesCancellationStartDate: toDateString(twoDaysAgo),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(true)
    })

    it('should not show weekday appointment more than 4 days ago', async () => {
      const fiveDaysAgo = subDays(new Date(), 5)
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
        appointmentSeriesFrequency: AppointmentFrequency.WEEKDAY,
        appointmentSeriesCancellationStartDate: toDateString(fiveDaysAgo),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(false)
    })

    it('should show weekday appointment that is 4 days old', async () => {
      const fourDaysAgo = subDays(new Date(), 4)
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
        appointmentSeriesFrequency: AppointmentFrequency.WEEKDAY,
        appointmentSeriesCancellationStartDate: toDateString(fourDaysAgo),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(true)
    })

    it('should not show weekly appointment more than 2 weeks ago', async () => {
      const fifteenDaysAgo = subDays(new Date(), 15)
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
        appointmentSeriesFrequency: AppointmentFrequency.WEEKLY,
        appointmentSeriesCancellationStartDate: toDateString(fifteenDaysAgo),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(false)
    })

    it('should show weekly appointment that is 2 weeks old', async () => {
      const twoWeeksAgo = subWeeks(new Date(), 2)
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
        appointmentSeriesFrequency: AppointmentFrequency.WEEKLY,
        appointmentSeriesCancellationStartDate: toDateString(twoWeeksAgo),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(true)
    })

    it('should not show fortnightly appointment more than 4 weeks ago', async () => {
      const twentyNineDaysAgo = subDays(new Date(), 29)
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
        appointmentSeriesFrequency: AppointmentFrequency.FORTNIGHTLY,
        appointmentSeriesCancellationStartDate: toDateString(twentyNineDaysAgo),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(false)
    })

    it('should show fortnightly appointment that is 4 weeks old', async () => {
      const fourWeeksAgo = subWeeks(new Date(), 4)
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
        appointmentSeriesFrequency: AppointmentFrequency.FORTNIGHTLY,
        appointmentSeriesCancellationStartDate: toDateString(fourWeeksAgo),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(true)
    })

    it('should not show monthly appointment more than 2 months ago', async () => {
      const overTwoMonthsAgo = subDays(subMonths(new Date(), 2), 1)
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
        appointmentSeriesFrequency: AppointmentFrequency.MONTHLY,
        appointmentSeriesCancellationStartDate: toDateString(overTwoMonthsAgo),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(false)
    })

    it('should show monthly appointment that is 2 months old', async () => {
      const twoMonthsAgo = subMonths(new Date(), 2)
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
        appointmentSeriesFrequency: AppointmentFrequency.MONTHLY,
        appointmentSeriesCancellationStartDate: toDateString(twoMonthsAgo),
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(true)
    })

    it('should show when not part of an appointment series', async () => {
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
        appointmentSeriesFrequency: AppointmentFrequency.DAILY,
        appointmentSeriesCancellationStartDate: null,
      }
      const showAppointment = applyCancellationDisplayRule(appointment)
      expect(showAppointment).toEqual(true)
    })
  })
})
