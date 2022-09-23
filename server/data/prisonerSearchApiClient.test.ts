import nock from 'nock'

import config from '../config'
import TokenStore from './tokenStore'
import PrisonerSearchApiClient from './prisonerSearchApiClient'
import { PrisonerSearchCriteria } from '../@types/prisonerOffenderSearchImport/types'
import { ServiceUser } from '../@types/express'

const user = {} as ServiceUser

jest.mock('./tokenStore')

describe('prisonerSearchApiClient', () => {
  let fakePrisonerSearchApi: nock.Scope
  let prisonerSearchApiClient: PrisonerSearchApiClient

  beforeEach(() => {
    fakePrisonerSearchApi = nock(config.apis.prisonerSearchApi.url)
    prisonerSearchApiClient = new PrisonerSearchApiClient()

    jest.spyOn(TokenStore.prototype, 'getToken').mockResolvedValue('accessToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('searchPrisoners', () => {
    it('should return data from api', async () => {
      const searchCriteria = { lastName: 'Smith' } as PrisonerSearchCriteria
      const response = { data: 'data' }

      fakePrisonerSearchApi
        .post('/prisoner-search/match-prisoners')
        .matchHeader('authorization', `Bearer accessToken`)
        .reply(200, response)

      const output = await prisonerSearchApiClient.searchInmates(searchCriteria, user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
