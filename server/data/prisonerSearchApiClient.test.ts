import nock from 'nock'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import PrisonerSearchApiClient from './prisonerSearchApiClient'
import { PrisonerNumbers } from '../@types/prisonerOffenderSearchImport/types'
import { ServiceUser } from '../@types/express'

const user = { username: 'jbloggs' } as ServiceUser

describe('prisonerSearchApiClient', () => {
  let fakePrisonerSearchApi: nock.Scope
  let prisonerSearchApiClient: PrisonerSearchApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    fakePrisonerSearchApi = nock(config.apis.prisonerSearchApi.url)
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue('test-system-token'),
    } as unknown as jest.Mocked<AuthenticationClient>
    prisonerSearchApiClient = new PrisonerSearchApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('searchByPrisonerNumbers', () => {
    it('should return data from api', async () => {
      const prisonerNumbers = { prisonerNumbers: ['G10', 'G11'] } as PrisonerNumbers
      const response = { data: 'data' }

      fakePrisonerSearchApi
        .post('/prisoner-search/prisoner-numbers', prisonerNumbers)
        .matchHeader('authorization', `Bearer test-system-token`)
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
        .matchHeader('authorization', `Bearer test-system-token`)
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
        .matchHeader('authorization', `Bearer test-system-token`)
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
