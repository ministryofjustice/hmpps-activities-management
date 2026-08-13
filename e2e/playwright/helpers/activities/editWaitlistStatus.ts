import getActivity from '../../../../integration_tests/fixtures/activitiesApi/getActivity.json'
import getPrisonerA1350DZ from '../../../../integration_tests/fixtures/prisonerSearchApi/getPrisoner-MDI-A1350DZ.json'
import { stubEndpoint } from '../../../../integration_tests/mockApis/wiremock'

const mathsActivity = structuredClone(getActivity)

mathsActivity.id = 1
mathsActivity.activityName = 'Maths level 1'
mathsActivity.schedules[0].id = 2
mathsActivity.schedules[0].startDate = '2025-06-23'

const waitlistApplication = {
  id: 1,
  activityId: 1,
  scheduleId: 2,
  allocationId: null,
  prisonerNumber: 'A1350DZ',
  status: 'PENDING',
  requestedDate: '2025-06-20',
  requestedBy: 'PRISONER',
  earliestReleaseDate: {
    releaseDate: '2023-12-25',
  },
  isIndeterminateSentence: true,
  activity: mathsActivity,
}

const waitlistSearchResponse = {
  content: [waitlistApplication],
  totalPages: 1,
  number: 0,
  totalElements: 1,
  first: true,
  last: true,
}

const setupEditWaitlistStatusScenario = async (): Promise<void> => {
  await stubEndpoint('POST', '/waiting-list-applications/MDI/search\\?page=0&pageSize=20', waitlistSearchResponse)

  await stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=false', [mathsActivity])

  await stubEndpoint('POST', '/prisoner-search/prisoner-numbers', [getPrisonerA1350DZ])

  await stubEndpoint('GET', '/prisoner/A1350DZ', getPrisonerA1350DZ)
  await stubEndpoint('GET', '/activities/1', getActivity)
  await stubEndpoint('GET', '/waiting-list-applications/1', waitlistApplication)
  await stubEndpoint('PATCH', '/waiting-list-applications/1', waitlistApplication)
  await stubEndpoint('GET', '/waiting-list-applications/1/history', [])

  await stubEndpoint('GET', '/schedules/2/waiting-list-applications\\?includeNonAssociationsCheck=false', [])

  await stubEndpoint('GET', '/activities/1/filtered', getActivity)
}

export const stubApprovedWaitlistApplication = async (): Promise<void> => {
  await stubEndpoint('GET', '/waiting-list-applications/1', {
    ...waitlistApplication,
    status: 'APPROVED',
  })
}

export default setupEditWaitlistStatusScenario
