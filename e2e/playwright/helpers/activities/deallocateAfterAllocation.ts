import { addHours, format, subWeeks } from 'date-fns'

import getActivities from '../../../../integration_tests/fixtures/activitiesApi/getActivities.json'
import getAllocations from '../../../../integration_tests/fixtures/activitiesApi/getAllocations.json'
import getAllocationsMaths from '../../../../integration_tests/fixtures/activitiesApi/getAllocationsMaths.json'
import getCandidateSuitability from '../../../../integration_tests/fixtures/activitiesApi/getCandidateSuitability.json'
import getCandidates from '../../../../integration_tests/fixtures/activitiesApi/getCandidates.json'
import getDeallocationReasons from '../../../../integration_tests/fixtures/activitiesApi/getDeallocationReasons.json'
import getSchedulesInActivity from '../../../../integration_tests/fixtures/activitiesApi/getSchedulesInActivity.json'
import moorlandIncentiveLevels from '../../../../integration_tests/fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import getPrisonerIepSummary from '../../../../integration_tests/fixtures/incentivesApi/getPrisonerIepSummary.json'
import getMdiPrisonRegime from '../../../../integration_tests/fixtures/prisonApi/getMdiPrisonRegime.json'
import getInmateDetails from '../../../../integration_tests/fixtures/prisonerSearchApi/getPrisoner-MDI-A5015DY.json'
import prisonerAllocations from '../../../../integration_tests/fixtures/activitiesApi/prisonerAllocationsA5015DY.json'
import { stubEndpoint } from '../../../../integration_tests/mockApis/wiremock'
import stubActivityAndSchedule from './activityAndScheduleStubs'

const allocations1 = [
  {
    id: 1,
    activityId: 1,
    prisonerNumber: 'A5015DY',
    activitySummary: 'Maths level 1',
    scheduleDescription: 'Entry level Maths 1',
    payBand: 'A',
    startDate: '2022-10-10',
    endDate: null,
    allocatedTime: '2022-10-10T09:30:00',
    allocatedBy: 'MR BLOGS',
    deallocatedTime: null,
    deallocatedBy: null,
    deallocatedReason: null,
    prisonerName: 'JO BLOGGS',
    prisonerFirstName: 'JO',
    prisonerLastName: 'BLOGGS',
    cellLocation: '2-1-007',
    releaseDate: '2040-06-23',
    nonAssociations: true,
  },
]

const setupDeallocateAfterAllocationScenario = async (): Promise<void> => {
  await stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=true', getActivities)

  await stubEndpoint('GET', '/prison/prison-regime/MDI', getMdiPrisonRegime)

  await stubEndpoint('GET', '/activities/(\\d)*/schedules', getSchedulesInActivity)

  await stubEndpoint('GET', '/schedules/2/suitability\\?prisonerNumber=A5015DY', getCandidateSuitability)

  await stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels)

  await stubEndpoint('GET', '/schedules/2/non-associations\\?prisonerNumber=A5015DY', [])

  await stubEndpoint('GET', '/schedules/2/allocations\\?activeOnly=true&includePrisonerSummary=true', getAllocations)

  await stubEndpoint('GET', '/schedules/1/allocations\\?activeOnly=true', allocations1)

  await stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations)

  await stubEndpoint('GET', '/schedules/2/waiting-list-applications\\?includeNonAssociationsCheck=true', [])

  await stubEndpoint('GET', '/schedules/2/candidates(.)*', getCandidates)

  await stubEndpoint('GET', '/prisoner/A5015DY', getInmateDetails)

  await stubEndpoint('GET', '/incentive-reviews/prisoner/A5015DY', getPrisonerIepSummary)

  await stubEndpoint('GET', '/allocations/deallocation-reasons', getDeallocationReasons)

  await stubEndpoint('POST', '/schedules/2/allocations')

  await stubEndpoint('GET', '/allocations/id/2', prisonerAllocations[0].allocations[1])

  await stubEndpoint('GET', '/allocations/id/1', prisonerAllocations[0].allocations[0])

  await stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails)

  await stubEndpoint('GET', '/schedules/2/allocations\\?activeOnly=true', getAllocationsMaths)

  await stubEndpoint('PUT', '/schedules/2/deallocate')

  const today = new Date()
  const startTime = format(addHours(today, 2), 'HH:mm')

  await stubActivityAndSchedule({
    activityStartDate: subWeeks(today, 2),
    subject: 'english',
  })

  await stubActivityAndSchedule({
    activityStartDate: today,
    subject: 'maths',
    startTime,
  })

  await stubActivityAndSchedule({
    activityStartDate: today,
    subject: 'science',
    startTime,
  })
}

export default setupDeallocateAfterAllocationScenario
