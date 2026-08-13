import { format } from 'date-fns'

import getAttendanceSummary from '../../../../integration_tests/fixtures/activitiesApi/getAttendanceSummary-11-93-94.json'
import getAttendanceReasons from '../../../../integration_tests/fixtures/activitiesApi/getAttendanceReasons.json'
import getCategories from '../../../../integration_tests/fixtures/activitiesApi/getCategories.json'
import getScheduledInstanceEnglishLevel1 from '../../../../integration_tests/fixtures/activitiesApi/getScheduledInstance93.json'
import getScheduledInstanceEnglishLevel2 from '../../../../integration_tests/fixtures/activitiesApi/getScheduledInstance11.json'
import getNonResidentialActivityLocations from '../../../../integration_tests/fixtures/locationsinsideprison/non-residential-usage-activities.json'
import { stubEndpoint } from '../../../../integration_tests/mockApis/wiremock'

const getToday = () => format(new Date(), 'yyyy-MM-dd')

const getScheduledInstances = () => {
  const today = getToday()

  return [
    {
      ...structuredClone(getScheduledInstanceEnglishLevel1),
      date: today,
    },
    {
      ...structuredClone(getScheduledInstanceEnglishLevel2),
      date: today,
    },
  ]
}

const getSummary = (cancelledInstanceId?: number) => {
  const today = getToday()

  return structuredClone(getAttendanceSummary).map(summary => ({
    ...summary,
    sessionDate: today,
    cancelled: summary.scheduledInstanceId === cancelledInstanceId ? true : summary.cancelled,
  }))
}

const setupCancelSingleSessionScenario = async (): Promise<void> => {
  const today = getToday()
  const scheduledInstances = getScheduledInstances()

  await stubEndpoint('GET', `/scheduled-instances/attendance-summary\\?prisonCode=MDI&date=${today}`, getSummary())
  await stubEndpoint('GET', '/activity-categories', getCategories)
  await stubEndpoint(
    'GET',
    '/locations/prison/MDI/non-residential-usage-type\\?formatLocalName=true',
    getNonResidentialActivityLocations,
  )
  await stubEndpoint('POST', '/scheduled-instances', scheduledInstances)
  await stubEndpoint('GET', '/scheduled-instances/11', scheduledInstances[1])
  await stubEndpoint('GET', '/attendance-reasons', getAttendanceReasons)
  await stubEndpoint('PUT', '/scheduled-instances/cancel')
}

export const stubCancelledSingleSession = async (): Promise<void> => {
  const today = getToday()

  await stubEndpoint('GET', `/scheduled-instances/attendance-summary\\?prisonCode=MDI&date=${today}`, getSummary(11))
}

export default setupCancelSingleSessionScenario
