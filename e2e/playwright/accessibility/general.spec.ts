import { accessibilityArea } from './support/run'
import { stubEndpoint } from '../../../integration_tests/mockApis/wiremock'

accessibilityArea('general', async screen => {
  if (screen.id === '403') await stubEndpoint('GET', '/prison/MDI/activities.*', {}, 403)
  if (screen.id === 'not-rolled-out')
    await stubEndpoint('GET', '/rollout/MDI', {
      prisonCode: 'MDI',
      activitiesRolledOut: false,
      appointmentsRolledOut: false,
    })
})
accessibilityArea('activities/home', async () => {})
accessibilityArea('appointments/home', async () => {})
