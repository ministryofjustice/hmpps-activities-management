import { PrisonPayBand } from '../../../../server/@types/activitiesAPI/types'
import { JourneyData } from '../../../../server/@types/express'
import { stubEndpoint } from '../../../../integration_tests/mockApis/wiremock'
import {
  stubBulkActiveAllocations,
  stubSuspendedOutsideAllocation,
} from '../../helpers/activities/suspensions/suspensions'
import prisoner from '../../../../integration_tests/fixtures/prisonerSearchApi/getPrisoner-MDI-A5015DY.json'

export const stubSuspensions = async () => {
  await stubBulkActiveAllocations()
  await stubSuspendedOutsideAllocation()
  await stubEndpoint('GET', '/users/USER1', { username: 'USER1', name: 'Test User', authSource: 'nomis' })
  await stubEndpoint('GET', '/activities/14/filtered', { id: 14, paid: true, outsideWork: true, pay: [] })
  await stubEndpoint('GET', '/prisoner/G0995GW', { ...prisoner, prisonerNumber: 'G0995GW' })
}
export const suspensionJourney: JourneyData = {
  suspendJourney: {
    inmate: { prisonerNumber: 'G0995GW', prisonerName: 'Stephen Gregs' },
    allocations: [
      {
        allocationId: 1234,
        activityId: 123,
        activityName: 'English level 1',
        payBand: { id: 315, alias: 'Low', displaySequence: 1 } as PrisonPayBand,
        outsideWork: false,
      },
    ],
    suspendFrom: '2030-01-01',
    suspendUntil: '2030-01-02',
    paid: 'Yes',
    caseNote: { type: 'GEN', text: 'Accessibility test suspension' },
  },
}
