import { smokeArea } from './support/run'
import stubCreateActivity from '../helpers/activities/createActivityStubs'
import { stubEndpoint } from '../../../integration_tests/mockApis/wiremock'
import activityJourney from './support/activity'

smokeArea(
  'activities/create-an-activity',
  async () => {
    await stubCreateActivity()
    await stubEndpoint('GET', '/activities/2/pay-history', [])
  },
  activityJourney,
)
