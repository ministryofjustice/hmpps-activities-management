import { AppointmentAttendanceSummary } from '../../../@types/activitiesAPI/types'

const getAttendanceSummary = (summaries: AppointmentAttendanceSummary[]) => {
  const attendanceSummary = {
    attendeeCount: summaries.map(s => s.attendeeCount).reduce((sum, count) => sum + count, 0),
    attended: summaries.map(s => s.attendedCount).reduce((sum, count) => sum + count, 0),
    notAttended: summaries.map(s => s.nonAttendedCount).reduce((sum, count) => sum + count, 0),
    notRecorded: summaries.map(s => s.notRecordedCount).reduce((sum, count) => sum + count, 0),
    attendedPercentage: 0,
    notAttendedPercentage: 0,
    notRecordedPercentage: 0,
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

export default getAttendanceSummary
