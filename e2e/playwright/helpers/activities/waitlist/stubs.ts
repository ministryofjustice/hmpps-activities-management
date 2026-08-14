import getActivity from '../../../../../integration_tests/fixtures/activitiesApi/getActivity.json'
import getPrisonerA1350DZ from '../../../../../integration_tests/fixtures/prisonerSearchApi/getPrisoner-MDI-A1350DZ.json'
import { stubEndpoint } from '../../../../../integration_tests/mockApis/wiremock'
import { buildWaitlistApplication, mathsActivity } from './fixtures'

type WaitlistApplication = ReturnType<typeof buildWaitlistApplication>

export const stubWaitlistDashboard = async (applications: WaitlistApplication[]): Promise<void> => {
  await stubEndpoint('POST', '/waiting-list-applications/MDI/search\\?page=0&pageSize=20', {
    content: applications,
    totalPages: 1,
    number: 0,
    totalElements: applications.length,
    first: true,
    last: true,
  })

  await stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=false', [mathsActivity])

  await stubEndpoint('POST', '/prisoner-search/prisoner-numbers', [getPrisonerA1350DZ])
}

export const stubWaitlistApplication = async (application: WaitlistApplication): Promise<void> => {
  await stubEndpoint('GET', `/waiting-list-applications/${application.id}`, application)
}

export const stubWaitlistApplicationView = async ({
  application,
  history = [],
}: {
  application: WaitlistApplication
  history?: unknown[]
}): Promise<void> => {
  await stubEndpoint('GET', `/prisoner/${application.prisonerNumber}`, getPrisonerA1350DZ)

  await stubEndpoint('GET', `/activities/${application.activityId}`, getActivity)

  await stubEndpoint('GET', `/activities/${application.activityId}/filtered`, getActivity)

  await stubWaitlistApplication(application)

  await stubEndpoint('GET', `/waiting-list-applications/${application.id}/history`, history)

  await stubEndpoint(
    'GET',
    `/schedules/${application.scheduleId}/waiting-list-applications\\?includeNonAssociationsCheck=false`,
    [],
  )
}
