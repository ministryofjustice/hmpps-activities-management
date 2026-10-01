import { accessibilityArea } from './support/run'
import { stubEndpoint } from '../../../integration_tests/mockApis/wiremock'
import regime from '../../../integration_tests/fixtures/activitiesApi/getPrisonRegime.json'
import bands from '../../../integration_tests/fixtures/activitiesApi/getMdiPrisonPayBands.json'
import categories from '../../../integration_tests/fixtures/activitiesApi/getAppointmentCategories.json'

accessibilityArea('activities/administration', () =>
  Promise.all([
    stubEndpoint('GET', '/prison/prison-regime/MDI', regime),
    stubEndpoint('GET', '/prison/MDI/prison-pay-bands', bands),
    stubEndpoint('GET', '/appointment-categories', categories),
    stubEndpoint('GET', '/migrate-appointment/MDI/summary.*', []),
  ]),
)
