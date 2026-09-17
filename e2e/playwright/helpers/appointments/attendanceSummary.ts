import { format, subDays } from 'date-fns'

import getAppointmentAttendanceSummaries from '../../../../integration_tests/fixtures/activitiesApi/getAppointmentAttendanceSummaries1.json'
import getAttendanceByStatus from '../../../../integration_tests/fixtures/activitiesApi/getAttendanceByStatus.json'
import getCategories from '../../../../integration_tests/fixtures/activitiesApi/getAppointmentCategories.json'
import getInmateDetails from '../../../../integration_tests/fixtures/prisonerSearchApi/getInmateDetailsForAttendance.json'
import { AttendanceStatus } from '../../../../server/@types/appointments'
import { stubEndpoint } from '../../../../integration_tests/mockApis/wiremock'

const stubAttendanceSummaryScenario = async (): Promise<{ today: Date; eightDaysAgo: Date }> => {
  const today = new Date()
  const eightDaysAgo = subDays(today, 8)
  const todayFormatted = format(today, 'yyyy-MM-dd')
  const eightDaysAgoFormatted = format(eightDaysAgo, 'yyyy-MM-dd')

  await stubEndpoint('GET', '/appointment-categories', getCategories)
  await stubEndpoint(
    'GET',
    `/appointments/MDI/attendance-summaries\\?date=${todayFormatted}`,
    getAppointmentAttendanceSummaries,
  )
  await stubEndpoint(
    'GET',
    `/appointments/MDI/${AttendanceStatus.ATTENDED}/attendance\\?date=${todayFormatted}`,
    getAttendanceByStatus,
  )
  await stubEndpoint(
    'GET',
    `/appointments/MDI/attendance-summaries\\?date=${eightDaysAgoFormatted}`,
    getAppointmentAttendanceSummaries,
  )
  await stubEndpoint(
    'GET',
    `/appointments/MDI/${AttendanceStatus.NOT_RECORDED}/attendance\\?date=${eightDaysAgoFormatted}`,
    getAttendanceByStatus.slice(0, 12),
  )
  await stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails)

  return { today, eightDaysAgo }
}

export default stubAttendanceSummaryScenario
