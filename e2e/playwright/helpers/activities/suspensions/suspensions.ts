import { format } from 'date-fns'

import getInmateDetails from '../../../../../integration_tests/fixtures/prisonerSearchApi/getPrisoner-MDI-A5015DY.json'
import { stubEndpoint } from '../../../../../integration_tests/mockApis/wiremock'

const outsidePaidActivity = {
  id: 14,
  paid: true,
  outsideWork: true,
  pay: [
    {
      prisonPayBand: { id: 314 },
      incentiveLevel: 'Standard',
      startDate: null,
      rate: 100,
    },
  ],
}

const activeOutsideAllocation = {
  id: 4,
  prisonerNumber: 'G0995GW',
  bookingId: 1058066,
  activitySummary: 'Hotel',
  activityId: 14,
  scheduleId: 345,
  prisonPayBand: {
    id: 314,
    displaySequence: 3,
    alias: 'Pay band 3',
    description: 'Pay band 3',
    nomisPayBand: 3,
    prisonCode: 'RSI',
    createdTime: null,
    createdBy: null,
    updatedTime: null,
    updatedBy: null,
  },
  startDate: '2024-12-09',
  endDate: null,
  status: 'ACTIVE',
  plannedSuspension: null,
}

const allocationsResponse = (allocation: unknown) => [
  {
    prisonerNumber: 'G0995GW',
    allocations: [allocation],
  },
]

export const stubSuspendedOutsideAllocation = async (): Promise<void> => {
  const today = format(new Date(), 'yyyy-MM-dd')

  await stubEndpoint(
    'POST',
    '/prisons/MDI/prisoner-allocations',
    allocationsResponse({
      ...activeOutsideAllocation,
      status: 'SUSPENDED_WITH_PAY',
      plannedSuspension: {
        plannedStartDate: today,
        plannedEndDate: null,
        caseNoteId: null,
        dpsCaseNoteId: null,
        plannedBy: 'USER1',
        plannedAt: `${today}T12:00:00`,
        paid: true,
      },
    }),
  )
}

export const stubBulkActiveAllocations = async (): Promise<void> => {
  await Promise.all([
    stubEndpoint('GET', '/activities/123/filtered', {
      id: 123,
      paid: true,
      outsideWork: false,
      pay: [
        {
          prisonPayBand: { id: 315 },
          incentiveLevel: 'Standard',
          startDate: null,
          rate: 100,
        },
      ],
    }),
    stubEndpoint('GET', '/activities/234/filtered', {
      id: 234,
      paid: false,
      outsideWork: false,
      pay: null,
    }),
    stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', [
      {
        prisonerNumber: 'G0995GW',
        allocations: [
          {
            id: 1234,
            prisonerNumber: 'G0995GW',
            bookingId: 1058066,
            activitySummary: 'Activity 1',
            activityId: 123,
            scheduleId: 234,
            prisonPayBand: {
              id: 315,
              displaySequence: 3,
              alias: 'Pay band 3',
              description: 'Pay band 3',
              nomisPayBand: 3,
              prisonCode: 'RSI',
            },
            startDate: '2024-12-09',
            endDate: null,
            status: 'ACTIVE',
            plannedSuspension: null,
          },
          {
            id: 2345,
            prisonerNumber: 'G0995GW',
            bookingId: 1058066,
            activitySummary: 'Activity 2',
            activityId: 234,
            scheduleId: 555,
            prisonPayBand: null,
            startDate: '2024-12-09',
            endDate: null,
            status: 'ACTIVE',
            plannedSuspension: null,
          },
        ],
      },
    ]),
  ])
}

export const stubBulkSuspendedAllocations = async (): Promise<void> => {
  const today = format(new Date(), 'yyyy-MM-dd')

  await stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', [
    {
      prisonerNumber: 'G0995GW',
      allocations: [
        {
          id: 1234,
          prisonerNumber: 'G0995GW',
          bookingId: 1058066,
          activitySummary: 'Activity 1',
          activityId: 123,
          scheduleId: 234,
          prisonPayBand: {
            id: 315,
            displaySequence: 3,
            alias: 'Pay band 3',
            description: 'Pay band 3',
            nomisPayBand: 3,
            prisonCode: 'RSI',
          },
          startDate: '2024-12-09',
          endDate: null,
          status: 'SUSPENDED_WITH_PAY',
          plannedSuspension: {
            plannedStartDate: today,
            plannedEndDate: null,
            caseNoteId: null,
            dpsCaseNoteId: null,
            plannedBy: 'USER1',
            plannedAt: `${today}T12:00:00`,
            paid: true,
          },
        },
        {
          id: 2345,
          prisonerNumber: 'G0995GW',
          bookingId: 1058066,
          activitySummary: 'Activity 2',
          activityId: 234,
          scheduleId: 555,
          prisonPayBand: null,
          startDate: '2024-12-09',
          endDate: null,
          status: 'SUSPENDED',
          plannedSuspension: {
            plannedStartDate: today,
            plannedEndDate: null,
            caseNoteId: null,
            dpsCaseNoteId: null,
            plannedBy: 'USER1',
            plannedAt: `${today}T12:01:00`,
            paid: false,
          },
        },
      ],
    },
  ])
}

const setupSingleSuspensionScenario = async (): Promise<void> => {
  await Promise.all([
    stubEndpoint('GET', '/prisoner/G0995GW', getInmateDetails),

    stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', allocationsResponse(activeOutsideAllocation)),

    stubEndpoint('GET', '/activities/14/filtered', outsidePaidActivity),

    stubEndpoint('POST', '/allocations/MDI/suspend', {}),

    stubEndpoint('POST', '/allocations/MDI/unsuspend', {}),

    // Needed when the suspension details page resolves plannedBy.
    stubEndpoint('GET', '/users/USER1', {
      username: 'USER1',
      name: 'Joe Bloggs',
      authSource: 'nomis',
      active: true,
    }),
  ])
}

export default setupSingleSuspensionScenario
