import nock from 'nock'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import NonAssociationsApiClient from './nonAssociationsApiClient'
import { ServiceUser } from '../@types/express'

const user = { username: 'jbloggs' } as ServiceUser

describe('nonAssociationsApiClient', () => {
  let fakeNonAssociationsApi: nock.Scope
  let nonAssociationsApiClient: NonAssociationsApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    fakeNonAssociationsApi = nock(config.apis.nonAssociationsApi.url)
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue('test-system-token'),
    } as unknown as jest.Mocked<AuthenticationClient>
    nonAssociationsApiClient = new NonAssociationsApiClient(mockAuthenticationClient)
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
        .matchHeader('authorization', `Bearer test-system-token`)
        .reply(200, response)

      const output = await nonAssociationsApiClient.getNonAssociationsBetween(['AA1111A', 'BB2222B'], user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
  describe('getNonAssociationsInvolving', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeNonAssociationsApi
        .post('/non-associations/involving')
        .matchHeader('authorization', `Bearer test-system-token`)
        .reply(200, response)

      const output = await nonAssociationsApiClient.getNonAssociationsInvolving(['AA1111A', 'BB2222B'], user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
  describe('getNonAssociationsByPrisonerNumber', () => {
    it('should return data from api', async () => {
      const mockOtherPrisonerDetails = {
        prisonerNumber: 'G6512VC',
        firstName: 'John',
        lastName: 'Smith',
        cellLocation: '1-2-002',
      }

      const mockNonAssociation = {
        id: 51510,
        role: 'NOT_RELEVANT',
        reason: 'GANG_RELATED',
        restrictionType: 'WING',
        restrictionTypeDescription: 'Cell, landing and wing',
        otherPrisonerDetails: mockOtherPrisonerDetails,
        isOpen: true,
      }

      fakeNonAssociationsApi
        .get('/prisoner/AA1111A/non-associations')
        .matchHeader('authorization', `Bearer test-system-token`)
        .reply(200, mockNonAssociation)

      const output = await nonAssociationsApiClient.getNonAssociationsByPrisonerNumber('AA1111A', user)

      expect(output).toEqual(mockNonAssociation)
      expect(nock.isDone()).toBe(true)
    })
  })
})
