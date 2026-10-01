import { format } from 'date-fns'
import { accessibilityArea } from './support/run'
import setupRecordAppointmentAttendanceScenario from '../helpers/appointments/recordAttendance'
import stubAttendanceSummaryScenario from '../helpers/appointments/attendanceSummary'

accessibilityArea('appointments/attendance', setupRecordAppointmentAttendanceScenario, {
  recordAppointmentAttendanceJourney: { date: format(new Date(), 'yyyy-MM-dd'), appointmentIds: [1] },
})
accessibilityArea('appointments/attendance-summary-stats', stubAttendanceSummaryScenario)
