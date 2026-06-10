import { AppointmentAttendanceSummary, AppointmentAttendeeByStatus } from '../../../@types/activitiesAPI/types'
import EventTier from '../../../enum/eventTiers'
import {
  enhanceAppointment,
  getAttendanceDataSubTitle,
  getAttendanceDataTitle,
  getEventTierCounts,
} from './attendanceUtils'
import { Prisoner } from '../../../@types/activities'
import { AttendanceStatus } from '../../../@types/appointments'

describe('getEventTierCounts', () => {
  it('should calculate the tier summaries correctly', () => {
    const summaries = [
      { eventTierType: EventTier.TIER_1, attendeeCount: 3, attendedCount: 3 },
      { eventTierType: EventTier.TIER_2, attendeeCount: 10, attendedCount: 8 },
      { eventTierType: EventTier.FOUNDATION, attendeeCount: 4, attendedCount: 0 },
      { eventTierType: EventTier.FOUNDATION, attendeeCount: 6, attendedCount: 0 },
      { eventTierType: EventTier.TIER_2, attendeeCount: 2, attendedCount: 2 },
    ] as AppointmentAttendanceSummary[]

    expect(getEventTierCounts(summaries)).toEqual({
      tier1Count: 3,
      tier2Count: 10,
      foundationCount: 0,
    })
  })
})

describe('enhanceAppointment', () => {
  let appointment: AppointmentAttendeeByStatus

  const prisoner = {
    prisonerName: 'AB123C',
  } as Prisoner

  beforeEach(() => {
    appointment = {
      appointmentId: 4567,
      appointmentName: 'Canteen',
      startDate: `2023-02-22`,
      startTime: `11:23`,
    } as AppointmentAttendeeByStatus
  })

  it('should enhance appointment when appointment has an end time', () => {
    appointment.endTime = '12:34'

    const result = enhanceAppointment(appointment, prisoner)

    expect(result).toEqual({
      ...appointment,
      ...prisoner,
      time: `11:23 to 12:34`,
      date: `22 February 2023`,
      timeDateSortingValue: new Date(`2023-02-22T11:23`),
      appointmentHref: '/appointments/attendance/4567/select-appointment',
    })
  })

  it('should enhance appointment when appointment has no end time', () => {
    appointment.endTime = null

    const result = enhanceAppointment(appointment, prisoner)

    expect(result).toEqual({
      ...appointment,
      ...prisoner,
      time: `11:23`,
      date: `22 February 2023`,
      timeDateSortingValue: new Date(`2023-02-22T11:23`),
      appointmentHref: '/appointments/attendance/4567/select-appointment',
    })
  })
})

describe('getAttendanceDataTitle', () => {
  it('should return "All not recorded yet" when isOlderThanSevenDays is false', () => {
    expect(getAttendanceDataTitle(AttendanceStatus.NOT_RECORDED, null, false)).toEqual('All not recorded yet')
  })

  it('should return "All not recorded yet" when isOlderThanSevenDays is not provided', () => {
    expect(getAttendanceDataTitle(AttendanceStatus.NOT_RECORDED, null)).toEqual('All not recorded yet')
  })

  it('should return "All not recorded" when isOlderThanSevenDays is true', () => {
    expect(getAttendanceDataTitle(AttendanceStatus.NOT_RECORDED, null, true)).toEqual('All not recorded')
  })
})

describe('getAttendanceDataSubTitle', () => {
  it('should return "X not recorded yet" when isOlderThanSevenDays is false', () => {
    expect(getAttendanceDataSubTitle(AttendanceStatus.NOT_RECORDED, null, 5, 3, false)).toEqual('5 not recorded yet')
  })

  it('should return "X not recorded yet" when isOlderThanSevenDays is not provided', () => {
    expect(getAttendanceDataSubTitle(AttendanceStatus.NOT_RECORDED, null, 5, 3)).toEqual('5 not recorded yet')
  })

  it('should return "X not recorded" when isOlderThanSevenDays is true', () => {
    expect(getAttendanceDataSubTitle(AttendanceStatus.NOT_RECORDED, null, 5, 3, true)).toEqual('5 not recorded')
  })
})
