import { accessibilityArea } from './support/run'
import { stubEndpoint } from '../../../integration_tests/mockApis/wiremock'
import stubCreateActivity from '../helpers/activities/createActivityStubs'
import activityFixture from '../../../integration_tests/fixtures/activitiesApi/getActivity.json'
import candidates from '../../../integration_tests/fixtures/activitiesApi/getCandidates.json'

const setup = async () => {
  await stubCreateActivity()
  await stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=true', [activityFixture])
  const activity = structuredClone(activityFixture)
  activity.schedules = activity.schedules.map(schedule => ({ ...schedule, allocations: [] }))
  await Promise.all([
    stubEndpoint('GET', '/activities/2/filtered.*', activity),
    stubEndpoint('GET', '/schedules/2/allocations.*', []),
    stubEndpoint('GET', '/schedules/2/waiting-list-applications.*', []),
    stubEndpoint('GET', '/schedules/2/candidates.*', candidates),
  ])
}
accessibilityArea('activities/manage-activities', setup)
accessibilityArea('activities/allocation-dashboard', setup)
