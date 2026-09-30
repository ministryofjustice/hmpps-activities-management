import { format } from 'date-fns'
import { smokeArea } from './support/run'
import setupRecordAppointmentAttendanceScenario from '../helpers/appointments/recordAttendance'
import stubAttendanceSummaryScenario from '../helpers/appointments/attendanceSummary'

smokeArea('appointments/attendance', setupRecordAppointmentAttendanceScenario, {
  recordAppointmentAttendanceJourney: { date: format(new Date(), 'yyyy-MM-dd'), appointmentIds: [1] },
})
smokeArea('appointments/attendance-summary-stats', stubAttendanceSummaryScenario)
