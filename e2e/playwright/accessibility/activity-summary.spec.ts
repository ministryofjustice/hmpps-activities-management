import { accessibilityArea } from './support/run'
import { stubEndpoint } from '../../../integration_tests/mockApis/wiremock'
import categories from '../../../integration_tests/fixtures/activitiesApi/getCategoriesIncludingRotl.json'
import getChangeEvents from '../../../integration_tests/fixtures/activitiesApi/getChangeEvents.json'

const setup = () =>
  Promise.all([
    stubEndpoint('GET', '/prisons/MDI/scheduled-instances.*', []),
    stubEndpoint('GET', '/attendances/MDI/2023-05-16.*', []),
    stubEndpoint('GET', '/scheduled-instances/attendance-summary.*', []),
    stubEndpoint('GET', '/attendances/MDI/suspended.*', []),
    stubEndpoint('GET', '/activity-categories.*', categories),
    stubEndpoint('POST', '/prisoner-search/prisoner-numbers', []),
    stubEndpoint('GET', '/event-review/prison/MDI.*', getChangeEvents),
  ])
accessibilityArea('activities/daily-attendance-summary', setup, { attendanceSummaryJourney: {} })
accessibilityArea('activities/change-of-circumstances', setup)
