import { accessibilityArea } from './support/run'
import { stubAllocations } from './support/allocations'
import { stubEndpoint } from '../../../integration_tests/mockApis/wiremock'
import activities from '../../../integration_tests/fixtures/activitiesApi/getActivities.json'

const setup = async () => {
  await stubAllocations()
  await Promise.all([
    stubEndpoint('GET', '/prisoner/A5015DY/non-associations.*', { prisonerNumber: 'A5015DY', nonAssociations: [] }),
    stubEndpoint('POST', '/waiting-list-applications/MDI/search.*', { content: [], totalElements: 0, totalPages: 0 }),
    stubEndpoint('GET', '/prison/MDI/activities.*', activities),
  ])
}
accessibilityArea('activities/prisoner-allocations', setup, {
  prisonerAllocationsJourney: {
    activityName: 'English level 1',
    scheduleId: 2,
    applicationId: 1,
    applicationDate: '2023-01-01',
    status: 'PENDING',
    requestedBy: 'PRISONER',
  },
})
