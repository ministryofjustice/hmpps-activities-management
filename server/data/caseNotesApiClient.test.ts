import nock from 'nock'

import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import { ServiceUser } from '../@types/express'
import CaseNotesApiClient from './caseNotesApiClient'

const user = { username: 'jbloggs' } as ServiceUser

describe('caseNotesApiClient', () => {
  let fakeCaseNotesApi: nock.Scope
  let caseNotesApiClient: CaseNotesApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    fakeCaseNotesApi = nock(config.apis.caseNotesApi.url)
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue('test-system-token'),
    } as unknown as jest.Mocked<AuthenticationClient>
    caseNotesApiClient = new CaseNotesApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getCaseNote', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeCaseNotesApi
        .get('/case-notes/ABCDEFG/b7602cc8-e769-4cbb-8194-62d8e655992a')
        .matchHeader('CaseloadId', '***')
        .matchHeader('authorization', `Bearer test-system-token`)
        .reply(200, response)

      const output = await caseNotesApiClient.getCaseNote('ABCDEFG', 'b7602cc8-e769-4cbb-8194-62d8e655992a', user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
