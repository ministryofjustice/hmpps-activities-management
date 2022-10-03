import { Response } from 'superagent'

import { stubFor } from './wiremock'

const stubUser = (firstName: string, lastName: string) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/api/users/me',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        accountStatus: 'ACTIVE',
        active: true,
        activeCaseLoadId: 'LEI',
        expiredFlag: false,
        firstName,
        lastName,
        lockedFlag: false,
        staffId: 231232,
        username: 'USER1',
      },
    },
  })

const stubCaseload = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/api/users/me/caseLoads',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: [
        { caseLoadId: 'MDI', description: 'Moorland (HMP & YOI)', currentlyActive: false },
        { caseLoadId: 'LEI', description: 'Leeds (HMP)', currentlyActive: true },
      ],
    },
  })

const stubSetActiveCaseload = () =>
  stubFor({
    request: {
      method: 'PUT',
      urlPattern: '/api/users/me/activeCaseLoad',
    },
    response: {
      status: 200,
    },
  })

export default {
  stubSetActiveCaseload,
  stubPrisonUser: (firstname = 'john', lastname = 'smith'): Promise<[Response, Response]> =>
    Promise.all([stubUser(firstname, lastname), stubCaseload()]),
}
