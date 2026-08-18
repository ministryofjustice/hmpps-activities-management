import getExternalActivities from '../../../../../integration_tests/fixtures/activitiesApi/getActivities-withExternal.json'
import getExternalActivity from '../../../../../integration_tests/fixtures/activitiesApi/getExternalActivity.json'
import getCandidates from '../../../../../integration_tests/fixtures/activitiesApi/getCandidates.json'
import getAllocations from '../../../../../integration_tests/fixtures/activitiesApi/getAllocations.json'
import prisonerAllocations from '../../../../../integration_tests/fixtures/activitiesApi/prisonerAllocations.json'
import getPrisonerA1350DZ from '../../../../../integration_tests/fixtures/prisonerSearchApi/getPrisoner-MDI-A1350DZ.json'
import getPrisonerA8644DY from '../../../../../integration_tests/fixtures/prisonerSearchApi/getPrisoner-MDI-A8644DY.json'
import getPrisonerA1351DZ from '../../../../../integration_tests/fixtures/prisonerSearchApi/getPrisoner-MDI-A1351DZ.json'
import getInmatesDetails from '../../../../../integration_tests/fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A1350DZ-A8644DY-A1351DZ.json'
import getNonAssociations from '../../../../../integration_tests/fixtures/activitiesApi/non_associations.json'
import moorlandIncentiveLevels from '../../../../../integration_tests/fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import { stubEndpoint } from '../../../../../integration_tests/mockApis/wiremock'

const hotel = getExternalActivity[1]
const hotelSchedule = hotel.schedules[0]

export default async function stubAllocateMultipleToExternalActivity() {
  await Promise.all([
    stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=true', getExternalActivities),

    stubEndpoint('GET', '/activities/4/filtered\\?includeScheduledInstances=false', hotel),
    stubEndpoint('GET', '/activities/4/filtered', hotel),
    stubEndpoint('GET', '/schedules/1238', hotelSchedule),

    stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels),

    stubEndpoint('GET', '/schedules/1238/waiting-list-applications\\?includeNonAssociationsCheck=true', []),
    stubEndpoint('GET', '/schedules/1238/candidates(.)*', getCandidates),
    stubEndpoint('GET', '/schedules/1238/allocations\\?activeOnly=true&includePrisonerSummary=true', getAllocations),

    stubEndpoint('GET', '/prison/MDI/prisoners\\?term=s&size=50', getInmatesDetails),
    stubEndpoint('POST', '/non-associations/involving\\?prisonId=MDI', getNonAssociations),

    stubEndpoint('GET', '/prisoner/A1350DZ', getPrisonerA1350DZ),
    stubEndpoint('GET', '/prisoner/A8644DY', getPrisonerA8644DY),
    stubEndpoint('GET', '/prisoner/A1351DZ', getPrisonerA1351DZ),

    stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations),

    stubEndpoint('GET', '/schedules/1238/allocations\\?includePrisonerSummary=true', []),

    stubEndpoint('POST', '/schedules/1238/allocations/bulk', {}),
  ])
}
