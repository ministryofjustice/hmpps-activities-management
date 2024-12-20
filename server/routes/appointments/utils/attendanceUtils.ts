import { Prisoner } from '../../../@types/activities'
import {
  AppointmentAttendanceSummary,
  AppointmentAttendeeByStatus,
  AppointmentDetails,
} from '../../../@types/activitiesAPI/types'
import { AttendanceStatus } from '../../../@types/appointments'
import EventTier from '../../../enum/eventTiers'
import { formatDate, simplifyTime } from '../../../utils/utils'

export type AppointmentSummaryStats = {
  attendeeCount: number
  attended: number
  notAttended: number
  notRecorded: number
  attendedPercentage: number
  notAttendedPercentage: number
  notRecordedPercentage: number
  tier1Count?: number
  tier2Count?: number
  foundationCount?: number
}

export const getAttendanceSummaryFromAttendanceSummaries = (summaries: AppointmentAttendanceSummary[]) => {
  const tierCounts = getEventTierCounts(summaries)

  const attendanceSummary = {
    attendeeCount: summaries.map(s => s.attendeeCount).reduce((sum, count) => sum + count, 0),
    attended: summaries.map(s => s.attendedCount).reduce((sum, count) => sum + count, 0),
    notAttended: summaries.map(s => s.nonAttendedCount).reduce((sum, count) => sum + count, 0),
    notRecorded: summaries.map(s => s.notRecordedCount).reduce((sum, count) => sum + count, 0),
    ...tierCounts,
  }

  const percentages = getPercentages(attendanceSummary)

  return {
    ...attendanceSummary,
    ...percentages,
  }
}

export const getAttendanceSummaryFromAppointmentDetails = (appointments: AppointmentDetails[]) => {
  let attendeeCount = 0
  let attended = 0
  let notAttended = 0
  let notRecorded = 0

  appointments.forEach(appointment => {
    attendeeCount += appointment.attendees.length
    appointment.attendees.forEach(attendee => {
      if (attendee.attended === true) {
        attended += 1
      } else if (attendee.attended === false) {
        notAttended += 1
      } else {
        notRecorded += 1
      }
    })
  })

  const attendanceSummary = {
    attendeeCount,
    attended,
    notAttended,
    notRecorded,
  }

  const percentages = getPercentages(attendanceSummary)

  return {
    ...attendanceSummary,
    ...percentages,
  }
}

export const getPercentages = attendanceSummary => {
  let attendedPercentage = 0
  let notAttendedPercentage = 0
  let notRecordedPercentage = 0

  if (attendanceSummary.attendeeCount > 0) {
    attendedPercentage = Math.round((attendanceSummary.attended / attendanceSummary.attendeeCount) * 100)
    notAttendedPercentage = Math.round((attendanceSummary.notAttended / attendanceSummary.attendeeCount) * 100)
    notRecordedPercentage = Math.round((attendanceSummary.notRecorded / attendanceSummary.attendeeCount) * 100)
  }

  return {
    attendedPercentage,
    notAttendedPercentage,
    notRecordedPercentage,
  }
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
