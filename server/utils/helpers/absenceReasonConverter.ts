import AttendanceReason from '../../enum/attendanceReason'

export default function absenceReasonDisplayConverter(reason: AttendanceReason): string {
  switch (reason) {
    case AttendanceReason.AUTO_SUSPENDED:
      return 'Automatically suspended'
    case AttendanceReason.CANCELLED:
      return 'Cancelled'
    case AttendanceReason.CLASH:
      return 'Clash'
    case AttendanceReason.NOT_REQUIRED:
      return 'Not required'
    case AttendanceReason.OTHER:
      return 'Other'
    case AttendanceReason.REFUSED:
      return 'Refused'
    case AttendanceReason.REST:
      return 'Rest day'
    case AttendanceReason.SICK:
      return 'Sick'
    case AttendanceReason.SUSPENDED:
      return 'Suspended'
    default:
      return null
  }
}
