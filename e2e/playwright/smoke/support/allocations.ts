import { Allocation, ActivitySchedule, ScheduledInstance } from '../../../../server/@types/activitiesAPI/types'
import { JourneyData } from '../../../../server/@types/express'
import { stubEndpoint } from '../../../../integration_tests/mockApis/wiremock'
import setupDeallocateAfterAllocationScenario from '../../helpers/activities/allocations/deallocateAfterAllocation'
import activity from '../../../../integration_tests/fixtures/activitiesApi/getActivity.json'
import schedule from '../../../../integration_tests/fixtures/activitiesApi/getSchedule.json'
import prisoner from '../../../../integration_tests/fixtures/prisonerSearchApi/getPrisoner-MDI-A5015DY.json'
import allocations from '../../../../integration_tests/fixtures/activitiesApi/prisonerAllocationsA5015DY.json'
import suitability from '../../../../integration_tests/fixtures/activitiesApi/getCandidateSuitability.json'
import activityJourney from './activity'

const inmate = {
  prisonerNumber: 'A5015DY',
  prisonerName: 'Alfonso Cholak',
  firstName: 'Alfonso',
  lastName: 'Cholak',
  prisonCode: 'MDI',
  status: 'ACTIVE IN',
  cellLocation: '1-1-1',
  startDate: '2030-01-01',
  incentiveLevel: 'Standard',
  payBand: { id: 11, alias: 'Low', rate: 100 },
  otherAllocations: [],
}
const journeyActivity = {
  activityId: 2,
  scheduleId: 2,
  name: 'English level 1',
  startDate: '2023-01-01',
  scheduleWeeks: 1,
  paid: true,
  outsideWork: false,
  location: 'Classroom',
}
export const allocationJourney: JourneyData = {
  allocateJourney: {
    inmate,
    inmates: [inmate],
    allocatedInmates: [inmate],
    activity: journeyActivity,
    startDate: '2030-01-01',
    endDate: '2030-01-02',
    deallocationReason: 'OTHER',
    exclusions: [],
    updatedExclusions: [],
    futureSameDaySlots: activityJourney.createJourney.baselineSlots,
    deallocationCaseNote: { type: 'GEN', text: 'Smoke allocation' },
    otherAllocations: allocations[0].allocations as unknown as Allocation[],
    activitiesToDeallocate: [{ ...journeyActivity, schedule: schedule as unknown as ActivitySchedule }],
    withoutMatchingIncentiveLevelInmates: [],
    scheduledInstance: {
      id: 93,
      date: '2030-01-01',
      startTime: '14:00',
      endTime: '15:00',
      timeSlot: 'PM',
    } as ScheduledInstance,
  },
}
export const stubAllocations = async () => {
  await setupDeallocateAfterAllocationScenario()
  const prisonerAllocations = structuredClone(allocations)
  prisonerAllocations[0].allocations.forEach(allocation => {
    Object.assign(allocation, {
      exclusions: [],
      plannedDeallocation: { plannedDate: '2030-01-02', plannedReason: { code: 'OTHER', description: 'Other' } },
    })
  })
  await Promise.all([
    stubEndpoint('GET', '/allocations/id/1', prisonerAllocations[0].allocations[0]),
    stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations),
    stubEndpoint('GET', '/schedules/2/allocations.*', prisonerAllocations[0].allocations),
    stubEndpoint('GET', '/activities/2/filtered.*', {
      ...activity,
      schedules: activity.schedules.map(s => ({ ...s, allocations: [] })),
    }),
    stubEndpoint('POST', '/prisoner-search/prisoner-numbers', [prisoner]),
    stubEndpoint('GET', '/schedules/[0-9]+', schedule),
    stubEndpoint('GET', '/schedules/2/suitability.*', suitability),
    stubEndpoint('GET', '/schedules/2/non-associations.*', []),
    stubEndpoint('GET', '/allocations/id/[0-9]+/exclusions/history', []),
    stubEndpoint('POST', '/non-associations/between', []),
    stubEndpoint('GET', '/users/.*', { username: 'USER1', name: 'Test User', authSource: 'nomis' }),
  ])
}
