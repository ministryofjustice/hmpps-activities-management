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
        activeCaseLoadId: 'MDI',
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
        { caseLoadId: 'MDI', description: 'Moorland (HMP & YOI)', currentlyActive: true },
        { caseLoadId: 'LEI', description: 'Leeds (HMP)', currentlyActive: false },
      ],
    },
  })

export default {
  stubPrisonUser: (firstname = 'john', lastname = 'smith'): Promise<[Response, Response]> =>
    Promise.all([stubUser(firstname, lastname), stubCaseload()]),
}
