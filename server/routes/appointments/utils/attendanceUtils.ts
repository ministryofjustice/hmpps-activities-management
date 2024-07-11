import { Prisoner } from '../../../@types/activities'
import { AppointmentAttendanceSummary, AppointmentAttendeeByStatus } from '../../../@types/activitiesAPI/types'
import { AttendanceStatus } from '../../../@types/appointments'
import EventTier from '../../../enum/eventTiers'
import { formatDate, simplifyTime } from '../../../utils/utils'

export const getAttendanceSummary = (summaries: AppointmentAttendanceSummary[]) => {
  const tierCounts = getEventTierCounts(summaries)
  const attendanceSummary = {
    attendeeCount: summaries.map(s => s.attendeeCount).reduce((sum, count) => sum + count, 0),
    attended: summaries.map(s => s.attendedCount).reduce((sum, count) => sum + count, 0),
    notAttended: summaries.map(s => s.nonAttendedCount).reduce((sum, count) => sum + count, 0),
    notRecorded: summaries.map(s => s.notRecordedCount).reduce((sum, count) => sum + count, 0),
    attendedPercentage: 0,
    notAttendedPercentage: 0,
    notRecordedPercentage: 0,
    ...tierCounts,
  }

  if (attendanceSummary.attendeeCount > 0) {
    attendanceSummary.attendedPercentage = Math.round(
      (attendanceSummary.attended / attendanceSummary.attendeeCount) * 100,
    )
    attendanceSummary.notAttendedPercentage = Math.round(
      (attendanceSummary.notAttended / attendanceSummary.attendeeCount) * 100,
    )
    attendanceSummary.notRecordedPercentage = Math.round(
      (attendanceSummary.notRecorded / attendanceSummary.attendeeCount) * 100,
    )
  }

  return attendanceSummary
}

export const getEventTierCounts = (summaries: AppointmentAttendanceSummary[]) => {
  const tier1 = summaries.filter(s => s.eventTierType === EventTier.TIER_1)
  const tier2 = summaries.filter(s => s.eventTierType === EventTier.TIER_2)
  const foundation = summaries.filter(s => s.eventTierType === EventTier.FOUNDATION)

  const attendedTier1 = tier1.map(summary => summary.attendedCount).reduce((sum, count) => sum + count, 0)
  const attendedTier2 = tier2.map(summary => summary.attendedCount).reduce((sum, count) => sum + count, 0)
  const attendedFoundation = foundation.map(summary => summary.attendedCount).reduce((sum, count) => sum + count, 0)

  return {
    tier1Count: attendedTier1,
    tier2Count: attendedTier2,
    foundationCount: attendedFoundation,
  }
}

export const getAttendanceDataTitle = (page: AttendanceStatus, eventTier: EventTier) => {
  switch (page) {
    case AttendanceStatus.ATTENDED:
      return 'All attended'
    case AttendanceStatus.NOT_ATTENDED:
      return 'All not attended'
    case AttendanceStatus.NOT_RECORDED:
      return 'All not recorded yet'
    case AttendanceStatus.CANCELLED:
      return 'All cancelled appointments'
    case AttendanceStatus.EVENT_TIER:
      if (eventTier === EventTier.TIER_1) return 'Tier 1 appointments'
      if (eventTier === EventTier.TIER_2) return 'Tier 2 appointments'
      return 'Routine (also called ’foundational’) appointments'
    default:
      return 'Appointment attendance'
  }
}

export const getAttendanceDataSubTitle = (
  page: AttendanceStatus,
  eventTier: EventTier,
  attendanceCount: number,
  appointmentCount: number,
) => {
  switch (page) {
    case AttendanceStatus.ATTENDED:
      return `${attendanceCount} attended`
    case AttendanceStatus.NOT_ATTENDED:
      return `${attendanceCount} not attended`
    case AttendanceStatus.NOT_RECORDED:
      return `${attendanceCount} not recorded yet`
    case AttendanceStatus.CANCELLED:
      return `${attendanceCount} cancelled appointments`
    case AttendanceStatus.EVENT_TIER:
      if (eventTier === EventTier.TIER_1)
        return `${attendanceCount} attendances recorded at ${appointmentCount} Tier 1 appointments`
      if (eventTier === EventTier.TIER_2)
        return `${attendanceCount} attendances recorded at ${appointmentCount} Tier 2 appointments`
      return `${attendanceCount} attendances recorded at ${appointmentCount} routine appointments`
    default:
      return `${appointmentCount} appointments`
  }
}

export const getSpecificAppointmentCount = (appointments: AppointmentAttendeeByStatus[]) => {
  return Array.from(new Set(appointments.map(appointment => appointment.appointmentId))).length
}

export const enhanceAppointment = (appointment: AppointmentAttendeeByStatus, prisoner: Prisoner) => {
  return {
    ...appointment,
    appointmentHref: `/appointments/${appointment.appointmentId}/attendance`,
    time: appointment.endTime
      ? `${simplifyTime(appointment.startTime)} to ${simplifyTime(appointment.endTime)}`
      : simplifyTime(appointment.startTime),
    date: formatDate(appointment.startDate, 'd MMMM yyyy'),
    ...prisoner,
    timeDateSortingValue: new Date(`${appointment.startDate}T${appointment.startTime}`),
  }
}
