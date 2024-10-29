import nock from 'nock'
import config from '../config'
import TokenStore from './tokenStore'
import NonAssociationsApiClient from './nonAssociationsApiClient'
import { ServiceUser } from '../@types/express'

const user = {} as ServiceUser

jest.mock('./tokenStore')

describe('nonAssociationsApiClient', () => {
  let fakeNonAssociationsApi: nock.Scope
  let nonAssociationsApiClient: NonAssociationsApiClient

  beforeEach(() => {
    fakeNonAssociationsApi = nock(config.apis.nonAssociationsApi.url)
    nonAssociationsApiClient = new NonAssociationsApiClient()

    jest.spyOn(TokenStore.prototype, 'getToken').mockResolvedValue('accessToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getNonAssociationsBetween', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeNonAssociationsApi
        .post('/non-associations/between')
        .matchHeader('authorization', `Bearer accessToken`)
        .reply(200, response)

      const output = await nonAssociationsApiClient.getNonAssociationsBetween(['AA1111A', 'BB2222B'], user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
