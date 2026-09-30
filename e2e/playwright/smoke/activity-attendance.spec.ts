import { smokeArea } from './support/run'
import { stubAttendance, attendanceJourney } from './support/attendance'

smokeArea('activities/record-attendance', stubAttendance, attendanceJourney)
