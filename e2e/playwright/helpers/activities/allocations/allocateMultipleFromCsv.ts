import { subWeeks } from 'date-fns'
import { stubEndpoint } from '../../../../../integration_tests/mockApis/wiremock'
import getAllocations from '../../../../../integration_tests/fixtures/activitiesApi/getAllocations.json'
import prisonerAllocations from '../../../../../integration_tests/fixtures/activitiesApi/prisonerAllocations.json'
import moorlandIncentiveLevels from '../../../../../integration_tests/fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import getInmateDetails from '../../../../../integration_tests/fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A1350DZ-A8644DY.json'
import getCandidates from '../../../../../integration_tests/fixtures/activitiesApi/getCandidates.json'
import getCandidateSuitability from '../../../../../integration_tests/fixtures/activitiesApi/getCandidateSuitability.json'
import getNonAssociationsInvolving from '../../../../../integration_tests/fixtures/nonAssociationsApi/getNonAssociationsInvolving.json'
import stubActivityAndSchedule from '../activityAndScheduleStubs'

export const stubAllocateMultipleFromCsv = async () => {
  await stubActivityAndSchedule({
    activityStartDate: subWeeks(new Date(), 2),
    subject: 'english',
  })

  await Promise.all([
    stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels),
    stubEndpoint('GET', '/schedules/2/allocations\\?activeOnly=true&includePrisonerSummary=true', getAllocations),
    stubEndpoint('GET', '/schedules/2/allocations\\?includePrisonerSummary=true', getAllocations),
    stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations),
    stubEndpoint('GET', '/schedules/2/waiting-list-applications\\?includeNonAssociationsCheck=true', []),
    stubEndpoint('GET', '/schedules/2/candidates(.)*', getCandidates),
    stubEndpoint('GET', '/schedules/2/suitability\\?prisonerNumber=A1350DZ', getCandidateSuitability),
    stubEndpoint('GET', '/schedules/2/suitability\\?prisonerNumber=A8644DY', getCandidateSuitability),
    stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails.content),
    stubEndpoint('POST', '/non-associations/involving\\?prisonId=MDI', getNonAssociationsInvolving),
    stubEndpoint('POST', '/schedules/2/allocations/bulk', {}),
  ])
}
