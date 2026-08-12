import getAttendanceReasons from '../../../../integration_tests/fixtures/activitiesApi/getAttendanceReasons.json'
import getScheduledInstance from '../../../../integration_tests/fixtures/activitiesApi/getScheduledInstance93.json'
import getAttendeesForScheduledInstance from '../../../../integration_tests/fixtures/activitiesApi/getAttendeesScheduledInstance93.json'
import getScheduledEvents from '../../../../integration_tests/fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import getInmateDetails from '../../../../integration_tests/fixtures/prisonerSearchApi/getInmateDetailsForNonAttendance.json'
import { stubEndpoint } from '../../../../integration_tests/mockApis/wiremock'

const date = '2023-02-02'

const refusedAttendance = [
  {
    attendanceId: 5,
    prisonCode: 'MDI',
    sessionDate: date,
    timeSlot: 'PM',
    status: 'COMPLETED',
    attendanceReasonCode: 'REFUSED',
    issuePayment: false,
    prisonerNumber: 'G7218GI',
    scheduledInstanceId: 93,
    activityId: 2,
    activitySummary: 'English level 1',
    categoryName: 'Education',
    recordedTime: null,
    attendanceRequired: true,
    eventTier: 'TIER_2',
    startTime: '14:00',
    endTime: '15:00',
    incentiveLevelWarningIssued: true,
  },
]

const setupRecordNonAttendanceScenario = async (): Promise<void> => {
  await stubEndpoint('GET', `/attendances/MDI/${date}`, refusedAttendance)

  await stubEndpoint('GET', `/prisons/MDI/scheduled-instances\\?startDate=${date}&endDate=${date}&cancelled=true`, [])

  await stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails)

  await stubEndpoint('GET', '/scheduled-instances/93', getScheduledInstance)

  await stubEndpoint('GET', '/scheduled-instances/93/scheduled-attendees', getAttendeesForScheduledInstance)

  await stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${date}`, getScheduledEvents)

  await stubEndpoint('GET', '/attendance-reasons', getAttendanceReasons)

  await stubEndpoint('PUT', '/attendances')
}

export default setupRecordNonAttendanceScenario
