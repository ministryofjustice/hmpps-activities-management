import { accessibilityArea } from './support/run'
import { stubAttendance, attendanceJourney } from './support/attendance'

accessibilityArea('activities/record-attendance', stubAttendance, attendanceJourney)
