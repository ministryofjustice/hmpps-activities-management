import nock from 'nock'

import config from '../config'
import TokenStore from './tokenStore'
import { ServiceUser } from '../@types/express'
import CaseNotesApiClient from './caseNotesApiClient'

const user = {} as ServiceUser

jest.mock('./tokenStore')

describe('caseNotesApiClient', () => {
  let fakeCaseNotesApi: nock.Scope
  let caseNotesApiClient: CaseNotesApiClient

  beforeEach(() => {
    fakeCaseNotesApi = nock(config.apis.caseNotesApi.url)
    caseNotesApiClient = new CaseNotesApiClient()

    jest.spyOn(TokenStore.prototype, 'getToken').mockResolvedValue('accessToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getCaseNote', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeCaseNotesApi
        .get('/case-notes/ABCDEFG/123456')
        .matchHeader('authorization', `Bearer accessToken`)
        .reply(200, response)

      const output = await caseNotesApiClient.getCaseNote('ABCDEFG', 123456, user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
