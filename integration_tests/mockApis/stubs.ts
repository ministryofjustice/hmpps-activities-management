import jwt from 'jsonwebtoken'
import frontendComponentJson from '../fixtures/frontendComponents/frontendComponent.json'

import { stubFor, getMatchingRequests, stubHealthPing } from './wiremock'

const createToken = () => {
  const payload = {
    user_name: 'USER1',
    scope: ['read'],
    auth_source: 'nomis',
    authorities: ['ROLE_ACTIVITY_HUB'],
    jti: '83b50a10-cca6-41db-985f-e87efb303ddb',
    client_id: 'clientid',
  }

  return jwt.sign(payload, 'secret', { expiresIn: '1h' })
}

const getSignInUrl = (): Promise<string> =>
  getMatchingRequests({
    method: 'GET',
    urlPath: '/auth/oauth/authorize',
  }).then(data => {
    const { requests } = data.body
    const stateValue = requests[requests.length - 1].queryParams.state.values[0]
    return `/sign-in/callback?code=codexxxx&state=${stateValue}`
  })

const favicon = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/favicon.ico',
    },
    response: {
      status: 200,
    },
  })

const authRedirect = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/auth/oauth/authorize\\?response_type=code&redirect_uri=.+?&state=.+?&client_id=clientid',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        Location: 'http://localhost:3007/sign-in/callback?code=codexxxx&state=stateyyyy',
      },
      body: '<html><body id="sign-in-page">SignIn page<h1>Sign in</h1></body></html>',
    },
  })

const signOut = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/auth/sign-out.*',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: '<html><body id="sign-in-page">SignIn page<h1>Sign in</h1></body></html>',
    },
  })

const manageAccountDetails = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/auth/account-details.*',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: '<html><body id="your-account-details-page"><h1>Your account details</h1></body></html>',
    },
  })

const token = () =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/auth/oauth/token',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        Location: 'http://localhost:3007/sign-in/callback?code=codexxxx&state=stateyyyy',
      },
      jsonBody: {
        access_token: createToken(),
        token_type: 'bearer',
        user_name: 'USER1',
        auth_source: 'nomis',
        expires_in: 599,
        scope: 'read',
        internalUser: true,
      },
    },
  })

const stubAuthUser = (name: string) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/users/USER1',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        staffId: 231232,
        username: 'USER1',
        active: true,
        activeCaseLoadId: 'MDI',
        authSource: 'nomis',
        name,
      },
    },
  })

const stubPrisonInformation = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/prisons/id/MDI',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        prisonName: 'Moorland',
      },
    },
  })

const stubVerifyToken = (active = true) =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/verification/token/verify',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: { active },
    },
  })

const stubRolloutPlan = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/rollout/(.)*',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: [{ prisonCode: 'MDI', activitiesRolledOut: true, appointmentsRolledOut: true }],
    },
  })

const frontendComponents = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/components\\?component=header&component=footer',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: frontendComponentJson,
    },
  })

const stubUserCaseLoads = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/api/users/me/caseLoads\\?allCaseloads=true',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: [
        {
          caseLoadId: 'MDI',
          currentlyActive: true,
          description: 'Moorland (HMP)',
          type: '',
          caseloadFunction: '',
        },
      ],
    },
  })

export default {
  getSignInUrl,
  stubHealthPing,
  stubVerifyToken,
  stubSignIn: (name = 'john smith') =>
    Promise.all([
      favicon(),
      stubUserCaseLoads(),
      frontendComponents(),
      authRedirect(),
      signOut(),
      manageAccountDetails(),
      token(),
      stubVerifyToken(),
      stubAuthUser(name),
      stubPrisonInformation(),
      stubRolloutPlan(),
    ]),
}
