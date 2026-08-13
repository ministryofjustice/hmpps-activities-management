import { stubEndpoint } from '../../../../../integration_tests/mockApis/wiremock'
import { buildWaitlistApplication } from './fixtures'
import { stubWaitlistApplication, stubWaitlistApplicationView, stubWaitlistDashboard } from './stubs'

const pendingApplication = buildWaitlistApplication()

const withdrawnApplication = buildWaitlistApplication({
  status: 'WITHDRAWN',
})

const setupReinstateWaitlistApplicationScenario = async (): Promise<void> => {
  await stubWaitlistDashboard([pendingApplication])

  await stubWaitlistApplicationView({
    application: withdrawnApplication,
  })

  await stubEndpoint('PATCH', '/waiting-list-applications/1', pendingApplication)
}

export const stubReinstatedWaitlistApplication = async (comment: string): Promise<void> => {
  await stubWaitlistApplication(
    buildWaitlistApplication({
      status: 'PENDING',
      comments: comment,
    }),
  )
}

export default setupReinstateWaitlistApplicationScenario
