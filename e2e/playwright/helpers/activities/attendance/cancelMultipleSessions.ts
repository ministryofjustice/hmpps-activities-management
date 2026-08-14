import { format } from 'date-fns'

import getAttendanceReasons from '../../../../../integration_tests/fixtures/activitiesApi/getAttendanceReasons.json'
import getAttendanceSummary from '../../../../../integration_tests/fixtures/activitiesApi/getAttendanceSummary-11-93-94.json'
import getAttendanceSummaryCancelled from '../../../../../integration_tests/fixtures/activitiesApi/getAttendanceSummary-11-93-94-cancelled.json'
import getCategories from '../../../../../integration_tests/fixtures/activitiesApi/getCategories.json'
import getScheduledEvents from '../../../../../integration_tests/fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import getAttendeesForScheduledInstance from '../../../../../integration_tests/fixtures/activitiesApi/getAttendeesScheduledInstance93.json'
import getScheduledInstanceEnglishLevel1 from '../../../../../integration_tests/fixtures/activitiesApi/getScheduledInstance93.json'
import getScheduledInstanceEnglishLevel1Cancelled from '../../../../../integration_tests/fixtures/activitiesApi/getScheduledInstance-cancelled.json'
import getScheduledInstanceEnglishLevel2 from '../../../../../integration_tests/fixtures/activitiesApi/getScheduledInstance11.json'
import getNonResidentialActivityLocations from '../../../../../integration_tests/fixtures/locationsinsideprison/non-residential-usage-activities.json'
import getInmateDetails from '../../../../../integration_tests/fixtures/prisonerSearchApi/getInmateDetailsForAttendance.json'
import { stubEndpoint } from '../../../../../integration_tests/mockApis/wiremock'

const getToday = () => format(new Date(), 'yyyy-MM-dd')

const setupCancelMultipleSessionsScenario = async (): Promise<void> => {
  const today = getToday()

  const englishLevel1 = structuredClone(getScheduledInstanceEnglishLevel1)
  englishLevel1.date = today

  const englishLevel2 = structuredClone(getScheduledInstanceEnglishLevel2)
  englishLevel2.date = today

  const attendanceSummary = structuredClone(getAttendanceSummary).map(summary => ({
    ...summary,
    sessionDate: today,
  }))

  await stubEndpoint('GET', `/scheduled-instances/attendance-summary\\?prisonCode=MDI&date=${today}`, attendanceSummary)

  await stubEndpoint('GET', '/activity-categories', getCategories)
  await stubEndpoint('GET', '/attendance-reasons', getAttendanceReasons)

  await stubEndpoint(
    'GET',
    '/locations/prison/MDI/non-residential-usage-type\\?formatLocalName=true',
    getNonResidentialActivityLocations,
  )

  await stubEndpoint('POST', '/scheduled-instances', [englishLevel1, englishLevel2])

  await stubEndpoint('GET', '/scheduled-instances/93/scheduled-attendees', getAttendeesForScheduledInstance)

  await stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${today}`, getScheduledEvents)

  await stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails)

  await stubEndpoint('PUT', '/scheduled-instances/cancel')
  await stubEndpoint('PUT', '/scheduled-instances/93')
  await stubEndpoint('PUT', '/scheduled-instances/93/uncancel')
}

export const stubCancelledSessionsSummary = async (): Promise<void> => {
  const today = getToday()

  const cancelledSummary = structuredClone(getAttendanceSummaryCancelled).map(summary => ({
    ...summary,
    sessionDate: today,
  }))

  await stubEndpoint('GET', `/scheduled-instances/attendance-summary\\?prisonCode=MDI&date=${today}`, cancelledSummary)
}

export const stubCancelledSession = async (issuePayment: boolean): Promise<void> => {
  const cancelledInstance = structuredClone(getScheduledInstanceEnglishLevel1Cancelled)

  cancelledInstance.date = getToday()
  cancelledInstance.cancelledIssuePayment = issuePayment

  await stubEndpoint('GET', '/scheduled-instances/93', cancelledInstance)
}

export const stubUncancelledSession = async (): Promise<void> => {
  const instance = structuredClone(getScheduledInstanceEnglishLevel1)
  instance.date = getToday()

  await stubEndpoint('GET', '/scheduled-instances/93', instance)
}

export default setupCancelMultipleSessionsScenario
