import { smokeArea } from './support/run'
import { stubEndpoint } from '../../../integration_tests/mockApis/wiremock'

smokeArea('general', async screen => {
  if (screen.id === '403') await stubEndpoint('GET', '/prison/MDI/activities.*', {}, 403)
  if (screen.id === 'not-rolled-out')
    await stubEndpoint('GET', '/rollout/MDI', {
      prisonCode: 'MDI',
      activitiesRolledOut: false,
      appointmentsRolledOut: false,
    })
})
smokeArea('activities/home', async () => {})
smokeArea('appointments/home', async () => {})
