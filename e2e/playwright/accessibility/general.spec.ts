import { accessibilityArea } from './support/run'
import { stubEndpoint } from '../../../integration_tests/mockApis/wiremock'

accessibilityArea('general', async screen => {
  if (screen.id === '403') await stubEndpoint('GET', '/prison/MDI/activities.*', {}, 403)
})
accessibilityArea('activities/home', async () => {})
accessibilityArea('appointments/home', async () => {})
