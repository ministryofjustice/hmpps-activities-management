import { accessibilityArea } from './support/run'
import stubCreateActivity from '../helpers/activities/createActivityStubs'
import { stubEndpoint } from '../../../integration_tests/mockApis/wiremock'
import getActivity from '../../../integration_tests/fixtures/activitiesApi/getActivity.json'
import activityJourney from './support/activity'

accessibilityArea(
  'activities/create-an-activity',
  async () => {
    await stubCreateActivity()
    await stubEndpoint('GET', '/activities/2/filtered.*', {
      ...getActivity,
      schedules: getActivity.schedules.map(schedule => ({ ...schedule, allocations: [] })),
    })
    await stubEndpoint('GET', '/activities/2/pay-history', [])
  },
  activityJourney,
)
