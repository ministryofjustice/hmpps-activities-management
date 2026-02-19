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

  const residentialLocationAttendanceStats = prisonersWithActivities.reduce(
    (acc, attendee) => {
      acc.totalAttendanceRecords += attendee.instanceIds.length

      attendee.attendances.forEach(attendance => {
        if (attendance.attendanceReason) {
          if (attendance.attendanceReason.code === AttendanceReason.ATTENDED) {
            acc.totalAttended += 1
          } else {
            acc.totalAbsences += 1
          }
        } else if (!attendance.attendanceReason) {
          acc.totalNotRecorded += 1
        }
      })

      return acc
    },
    {
      totalAttendanceRecords: 0,
      totalAttended: 0,
      totalAbsences: 0,
      totalNotRecorded: 0,
    },
  )

  return {
    totalAttendees,
    ...residentialLocationAttendanceStats,
  }
}
