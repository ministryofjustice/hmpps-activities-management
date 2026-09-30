import { smokeArea } from './support/run'
import { stubEndpoint } from '../../../integration_tests/mockApis/wiremock'
import setupOutsideMovementList from '../helpers/activities/unlockAndMovementLists/unlockAndMovementLists'
import locations from '../../../integration_tests/fixtures/activitiesApi/getLocationGroups.json'
import categories from '../../../integration_tests/fixtures/activitiesApi/getCategoriesIncludingRotl.json'

const setup = async () => {
  await setupOutsideMovementList()
  await Promise.all([
    stubEndpoint('GET', '/locations/prison/MDI/location-groups', locations),
    stubEndpoint('GET', '/activity-categories.*', categories),
    stubEndpoint('GET', '/locations/prison/MDI/location-prefix\\?.*', { locationPrefix: 'MDI-1-.+' }),
    stubEndpoint('POST', '/locations/prison/MDI/location-prefixes\\?.*', []),
    stubEndpoint('GET', '/prison/MDI/prisoners\\?.*', { content: [], totalElements: 0 }),
  ])
}
smokeArea('activities/movement-list', setup, { movementListJourney: {} })
smokeArea('activities/unlock-list', setup, { unlockListJourney: { locationKey: locations[0].key, timeSlot: 'AM' } })
