import AttendanceReason from '../../../../enum/attendanceReason'
import { PrisonerWithAttendanceRecord } from '../../../../@types/attendanceRecords'

/**
 * Counts attendance stats for grouped prisoner data where a prisoner can have multiple allocations.
 * Unlike getAttendanceSummary (flat counts) in utils.ts, this counts both prisoners and their activity instances separately.
 */

export interface AttendanceStats {
  totalAttendees: number
  totalAttendanceRecords: number
  totalAttended: number
  totalAbsences: number
  totalNotRecorded: number
}

export const getResidentialLocationAttendanceStats = (
  prisonersWithActivities: PrisonerWithAttendanceRecord[],
): AttendanceStats => {
  const totalAttendees = prisonersWithActivities.length

  const totalAttendanceRecords = prisonersWithActivities.reduce(
    (total: number, attendee: PrisonerWithAttendanceRecord) => total + attendee.instanceIds.length,
    0,
  )

  const totalAttended = prisonersWithActivities.reduce((total: number, attendee: PrisonerWithAttendanceRecord) => {
    return (
      total +
      attendee.attendances.filter(
        a => a.status === 'COMPLETED' && a.attendanceReason && a.attendanceReason?.code === AttendanceReason.ATTENDED,
      ).length
    )
  }, 0)

  const totalAbsences = prisonersWithActivities.reduce((total: number, attendee: PrisonerWithAttendanceRecord) => {
    return (
      total +
      attendee.attendances.filter(
        a => a.status === 'COMPLETED' && a.attendanceReason && a.attendanceReason?.code !== AttendanceReason.ATTENDED,
      ).length
    )
  }, 0)

  const totalNotRecorded = prisonersWithActivities.reduce((total: number, attendee: PrisonerWithAttendanceRecord) => {
    return total + attendee.attendances.filter(a => !a.attendanceReason).length
  }, 0)

  return {
    totalAttendees,
    totalAttendanceRecords,
    totalAttended,
    totalAbsences,
    totalNotRecorded,
  }
}
