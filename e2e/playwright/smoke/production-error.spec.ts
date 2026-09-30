import { smokeArea } from './support/run'
import productionTest from './support/production'
import { stubEndpoint } from '../../../integration_tests/mockApis/wiremock'

smokeArea(
  'production-error',
  () => stubEndpoint('GET', '/prison/MDI/activities.*', {}, 500),
  {},
  undefined,
  productionTest,
)
