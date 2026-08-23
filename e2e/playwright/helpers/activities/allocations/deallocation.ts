import { addWeeks, format } from 'date-fns'

import getActivities from '../../../../../integration_tests/fixtures/activitiesApi/getActivities.json'
import getActivity from '../../../../../integration_tests/fixtures/activitiesApi/getActivity.json'
import getSchedule from '../../../../../integration_tests/fixtures/activitiesApi/getSchedule.json'
import getAllocations from '../../../../../integration_tests/fixtures/activitiesApi/getAllocations.json'
import prisonerAllocations from '../../../../../integration_tests/fixtures/activitiesApi/prisonerAllocations.json'
import moorlandIncentiveLevels from '../../../../../integration_tests/fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import getInmateDetails from '../../../../../integration_tests/fixtures/prisonerSearchApi/getInmateDetailsForDeallocation.json'
import getDeallocationReasons from '../../../../../integration_tests/fixtures/activitiesApi/getDeallocationReasons.json'
import getMdiPrisonPayBands from '../../../../../integration_tests/fixtures/activitiesApi/getMdiPrisonPayBands.json'
import getCandidates from '../../../../../integration_tests/fixtures/activitiesApi/getCandidates.json'
import getMdiPrisonRegime from '../../../../../integration_tests/fixtures/prisonApi/getMdiPrisonRegime.json'

import { stubEndpoint } from '../../../../../integration_tests/mockApis/wiremock'

const stubActivityAndSchedule = async (activityStartDate: Date): Promise<void> => {
  const activity = structuredClone(getActivity)
  const schedule = structuredClone(getSchedule)

  const startDate = format(activityStartDate, 'yyyy-MM-dd')

  activity.schedules[0].startDate = startDate

  activity.schedules[0].allocations = activity.schedules[0].allocations.map(allocation => ({
    ...allocation,
    startDate,
  }))

  let activityInstanceDate = activityStartDate

  activity.schedules[0].instances = activity.schedules[0].instances.map(instance => {
    const date = format(activityInstanceDate, 'yyyy-MM-dd')
    activityInstanceDate = addWeeks(activityInstanceDate, 1)

    return {
      ...instance,
      date,
    }
  })

  let scheduleInstanceDate = activityStartDate

  schedule.instances = schedule.instances.map(instance => {
    const date = format(scheduleInstanceDate, 'yyyy-MM-dd')
    scheduleInstanceDate = addWeeks(scheduleInstanceDate, 1)

    return {
      ...instance,
      date,
    }
  })

  const filteredActivity = structuredClone(activity)

  filteredActivity.schedules = filteredActivity.schedules.map(activitySchedule => ({
    ...activitySchedule,
    instances: [],
  }))

  await Promise.all([
    stubEndpoint('GET', '/activities/2/filtered', activity),
    stubEndpoint('GET', '/activities/2/filtered\\?includeScheduledInstances=false', filteredActivity),
    stubEndpoint('GET', '/schedules/2', schedule),
  ])
}

const setupDeallocationScenario = async (activityStartDate: Date, existingEndDate?: Date): Promise<void> => {
  const allocations = structuredClone(getAllocations)

  if (existingEndDate) {
    const endDate = format(existingEndDate, 'yyyy-MM-dd')

    const allocationWithPlannedDeallocation = {
      ...allocations[0],
      endDate,
      plannedDeallocation: {
        id: 11,
        plannedDate: endDate,
        plannedBy: 'USER1',
        plannedReason: {
          code: 'OTHER',
          description: 'Other',
        },
        plannedAt: new Date().toISOString(),
      },
    }

    allocations.splice(0, 1, allocationWithPlannedDeallocation)
  }

  await Promise.all([
    stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=true', getActivities),
    stubEndpoint('GET', '/prison/prison-regime/MDI', getMdiPrisonRegime),
    stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels),

    stubEndpoint('GET', '/schedules/2/allocations\\?activeOnly=true&includePrisonerSummary=true', allocations),
    stubEndpoint('GET', '/schedules/2/allocations\\?activeOnly=true', allocations),

    stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations),

    stubEndpoint('GET', '/schedules/2/waiting-list-applications\\?includeNonAssociationsCheck=true', []),

    stubEndpoint('GET', '/schedules/2/candidates(.)*', getCandidates),
    stubEndpoint('GET', '/allocations/deallocation-reasons', getDeallocationReasons),
    stubEndpoint('GET', '/prison/MDI/prison-pay-bands', getMdiPrisonPayBands),
    stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails),

    stubEndpoint('PUT', '/schedules/2/deallocate'),
  ])

  if (existingEndDate) {
    const allocation = {
      ...allocations[0],
      allocatedBy: 'USER1',
      exclusions: [],
      prisonPayBand: { id: 11 },
    }

    await Promise.all([
      stubEndpoint('GET', '/allocations/id/2', allocation),
      stubEndpoint('GET', '/allocations/id/2/exclusions/history', []),
      stubEndpoint('GET', '/prisoner/G4793VF', getInmateDetails[0]),
    ])
  }

  await stubActivityAndSchedule(activityStartDate)
}

export default setupDeallocationScenario
