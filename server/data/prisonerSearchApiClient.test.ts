import nock from 'nock'
import config from '../config'
import TokenStore from './tokenStore'
import PrisonerSearchApiClient from './prisonerSearchApiClient'
import { PrisonerNumbers } from '../@types/prisonerOffenderSearchImport/types'
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

  describe('getInmates', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonerSearchApi
        .get('/prison/MDI/prisoners')
        .query({ page: '1', size: '10' })
        .matchHeader('authorization', `Bearer accessToken`)
        .reply(200, response)

      const output = await prisonerSearchApiClient.getInmates('MDI', 1, 10, user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('searchByPrisonerNumbers', () => {
    it('should return data from api', async () => {
      const prisonerNumbers = { prisonerNumbers: ['G10', 'G11'] } as PrisonerNumbers
      const response = { data: 'data' }

      fakePrisonerSearchApi
        .post('/prisoner-search/prisoner-numbers', prisonerNumbers)
        .matchHeader('authorization', `Bearer accessToken`)
        .reply(200, response)

      const output = await prisonerSearchApiClient.searchByPrisonerNumbers(prisonerNumbers, user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('searchPrisonInmates', () => {
    it('should return data from api', async () => {
      const query = 'G10'
      const response = { data: 'data' }

      fakePrisonerSearchApi
        .get(`/prison/MDI/prisoners?term=${query}&size=50`)
        .matchHeader('authorization', `Bearer accessToken`)
        .reply(200, response)

      const output = await prisonerSearchApiClient.searchPrisonInmates(query, 'MDI', user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('searchPrisonersByLocationPrefix', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      const prisonCode = 'MDI'
      const locationPrefix = 'MDI-1-'

      const expectedSearchParams = new URLSearchParams({
        page: '0',
        size: '1000',
        cellLocationPrefix: locationPrefix,
        sort: 'cellLocation',
      })

      fakePrisonerSearchApi
        .get(`/prison/${prisonCode}/prisoners`)
        .matchHeader('authorization', `Bearer accessToken`)
        .query(expectedSearchParams)
        .reply(200, response)

      const output = await prisonerSearchApiClient.searchPrisonersByLocationPrefix(
        prisonCode,
        locationPrefix,
        0,
        1000,
        user,
      )

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
