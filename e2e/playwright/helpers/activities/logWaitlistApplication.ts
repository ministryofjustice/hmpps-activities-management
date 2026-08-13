import { format, subDays } from 'date-fns'

import getActivitiesWithEA from '../../../../integration_tests/fixtures/activitiesApi/getActivities-withExternal.json'
import getActivity from '../../../../integration_tests/fixtures/activitiesApi/getActivity.json'
import getPrisonerA1350DZ from '../../../../integration_tests/fixtures/prisonerSearchApi/getPrisoner-MDI-A1350DZ.json'
import { stubEndpoint } from '../../../../integration_tests/mockApis/wiremock'

const setupLogWaitlistApplicationScenario = async (): Promise<void> => {
  const activity = structuredClone(getActivity)

  activity.id = 1
  activity.summary = 'Maths level 1'
  activity.description = 'Maths level 1'
  activity.schedules[0].startDate = format(subDays(new Date(), 1), 'yyyy-MM-dd')

  await stubEndpoint('GET', '/prisoner/A1350DZ', getPrisonerA1350DZ)

  await stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=true', getActivitiesWithEA)

  await stubEndpoint('GET', '/activities/1/filtered', activity)

  await stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', [])

  await stubEndpoint('GET', '/schedules/2/waiting-list-applications\\?includeNonAssociationsCheck=false', [])

  await stubEndpoint('POST', '/allocations/MDI/waiting-list-application', [])
}

export default setupLogWaitlistApplicationScenario
