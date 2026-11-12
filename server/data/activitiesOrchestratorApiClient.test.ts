import nock from 'nock'

import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import ActivitiesOrchestratorApiClient from './activitiesOrchestratorApiClient'
import TokenStore from './tokenStore'
import { ServiceUser } from '../@types/express'
import { EventReviewSearchResultsDto, GetEventsForReviewParams } from '../@types/activitiesOrchestratorAPI/types'

const user = { token: 'token', activeCaseLoadId: 'MDI' } as ServiceUser

jest.mock('./tokenStore')

describe('activitiesOrchestratorApiClient', () => {
  let fakeActivitiesOrchestratorApi: nock.Scope
  let activitiesOrchestratorApiClient: ActivitiesOrchestratorApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue('test-system-token'),
    } as unknown as jest.Mocked<AuthenticationClient>
    fakeActivitiesOrchestratorApi = nock(config.apis.activitiesOrchestratorApi.url)
    activitiesOrchestratorApiClient = new ActivitiesOrchestratorApiClient(mockAuthenticationClient)
    jest.spyOn(TokenStore.prototype, 'getToken').mockResolvedValue('accessToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getChangeEvents', () => {
    it('should return change events from the API', async () => {
      const content = [
        {
          eventReviewId: 1,
          serviceIdentifier: null,
          eventType: 'prison.xxx.yyy',
          eventTime: '2023-10-16 23:14:22',
          prisonCode: 'MDI',
          prisonerNumber: 'A1234AA',
          eventData: 'Some data',
        },
      ]
      const response = {
        content,
        pageNumber: 1,
        totalElements: 1,
        totalPages: 1,
      } as EventReviewSearchResultsDto

      const params: GetEventsForReviewParams = {
        prisonCode: 'MDI',
        requestDate: '2023-01-01',
        page: 0,
        pageSize: 10,
        prisonerNumbers: ['A1234AA'],
        filterAcknowledged: false,
        filterEventTypes: ['prisoner-offender-search.prisoner.alerts-updated'],
      }
      fakeActivitiesOrchestratorApi
        .get('/event-review/prison/MDI')
        .query({
          date: '2023-01-01',
          prisonerNumbers: 'A1234AA',
          filterAcknowledged: false,
          filterEventTypes: 'prisoner-offender-search.prisoner.alerts-updated',
          page: 0,
          size: 10,
        })
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200, response)
      const output = await activitiesOrchestratorApiClient.getEventsForReview(params, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
