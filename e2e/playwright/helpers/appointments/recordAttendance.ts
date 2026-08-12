import { format } from 'date-fns'

import getAppointmentAttendanceSummaries from '../../../../integration_tests/fixtures/activitiesApi/appointments/getAppointmentAttendanceSummaries.json'
import getAppointmentLocations from '../../../../integration_tests/fixtures/activitiesApi/appointments/getAppointmentLocationsMDI.json'
import getAppointmentsDetailsMultiple from '../../../../integration_tests/fixtures/activitiesApi/appointments/getAppointmentsDetailsMultiple.json'
import getPrisoners from '../../../../integration_tests/fixtures/activitiesApi/appointments/getPrisoners.json'
import getSingleAppointmentGym from '../../../../integration_tests/fixtures/activitiesApi/appointments/getSingleAppointmentGym.json'
import getScheduledEvents from '../../../../integration_tests/fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import getPrisonerG0256VF from '../../../../integration_tests/fixtures/prisonerSearchApi/getPrisoner-MDI-G0256VF.json'
import { stubEndpoint } from '../../../../integration_tests/mockApis/wiremock'

const setupRecordAppointmentAttendanceScenario = async (): Promise<void> => {
  const today = format(new Date(), 'yyyy-MM-dd')

  const appointmentsDetailsWithTodayDate = getAppointmentsDetailsMultiple.map(appointment => ({
    ...appointment,
    startDate: today,
  }))

  const singleAppointmentWithTodayDate = {
    ...getSingleAppointmentGym,
    startDate: today,
  }

  await stubEndpoint('GET', '/users/jsmith', {
    name: 'John Smith',
    username: 'jsmith',
    authSource: 'nomis',
  })

  await stubEndpoint('GET', `/appointments/MDI/attendance-summaries\\?date=${today}`, getAppointmentAttendanceSummaries)

  await stubEndpoint('GET', '/prisoner/G0256VF', getPrisonerG0256VF)

  await stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getPrisoners)

  await stubEndpoint('GET', '/appointment-locations/MDI', getAppointmentLocations)

  await stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${today}`, getScheduledEvents)

  await stubEndpoint('POST', '/appointments/details', appointmentsDetailsWithTodayDate)

  await stubEndpoint('GET', '/appointments/1/details', singleAppointmentWithTodayDate)

  await stubEndpoint('PUT', '/appointments/updateAttendances\\?action=ATTENDED')

  await stubEndpoint('PUT', '/appointments/updateAttendances\\?action=NOT_ATTENDED')
}

export default setupRecordAppointmentAttendanceScenario
