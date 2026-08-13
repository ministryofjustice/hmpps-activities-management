import { stubEndpoint } from '../../../../../integration_tests/mockApis/wiremock'
import { buildWaitlistApplication } from '../waitlist/fixtures'
import { stubWaitlistApplication, stubWaitlistApplicationView, stubWaitlistDashboard } from '../waitlist/stubs'

const pendingApplication = buildWaitlistApplication({
  status: 'PENDING',
  statusUpdatedTime: '2025-06-20T14:22:00',
})

const setupEditWaitlistStatusScenario = async (): Promise<void> => {
  await stubWaitlistDashboard([pendingApplication])

  await stubWaitlistApplicationView({
    application: pendingApplication,
  })

  await stubEndpoint('PATCH', '/waiting-list-applications/1', pendingApplication)
}

export const stubApprovedWaitlistApplication = async (): Promise<void> => {
  await stubWaitlistApplication(
    buildWaitlistApplication({
      status: 'APPROVED',
      statusUpdatedTime: '2025-06-20T14:22:00',
    }),
  )
}

export default setupEditWaitlistStatusScenario
