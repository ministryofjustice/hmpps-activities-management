import { when } from 'jest-when'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import ActivitiesOrchestratorApiClient from '../data/activitiesOrchestratorApiClient'
import { EventReviewSearchResultsDto, GetEventsForReviewParams } from '../@types/activitiesOrchestratorAPI/types'
import ActivitiesOrchestratorService from './activitiesOrchestratorService'
import { ServiceUser } from '../@types/express'

jest.mock('../data/activitiesOrchestratorApiClient')

const mockAuthenticationClient = {
  getToken: jest.fn().mockResolvedValue('test-system-token'),
} as unknown as jest.Mocked<AuthenticationClient>

describe('Activities Orchestrator service', () => {
  const activitiesOrchestratorApiClient = new ActivitiesOrchestratorApiClient(
    mockAuthenticationClient,
  ) as jest.Mocked<ActivitiesOrchestratorApiClient>
  const activitiesOrchestratorService = new ActivitiesOrchestratorService(activitiesOrchestratorApiClient)

  const user = { activeCaseLoadId: 'MDI', username: 'USER1', displayName: 'John Smith' } as ServiceUser

  describe('getReviewEvents', () => {
    it('should get a list of change events from activities API', async () => {
      const content = [
        {
          eventReviewId: 1,
          serviceIdentifier: null,
          eventType: 'prison.xxx.yyy',
          eventTime: '2023-10-16 23:14:22',
          prisonCode: 'MDI',
          prisonerNumber: 'A1234AA',
          eventData: 'Some data',
        } as unknown as EventReviewSearchResultsDto,
        {
          eventReviewId: 2,
          serviceIdentifier: null,
          eventType: 'prison.xxx.yyy',
          eventTime: '2023-10-16 23:14:22',
          prisonCode: 'MDI',
          prisonerNumber: 'A1234AA',
          eventData: 'Some data',
        } as unknown as EventReviewSearchResultsDto,
        {
          eventReviewId: 3,
          serviceIdentifier: null,
          eventType: 'prison.xxx.yyy',
          eventTime: '2023-10-16 23:14:22',
          prisonCode: 'MDI',
          prisonerNumber: 'A1234AA',
          eventData: 'Some data',
        } as unknown as EventReviewSearchResultsDto,
      ]

      const expectedResult = {
        content,
        pageNumber: 1,
        totalElements: 3,
        totalPages: 1,
      } as unknown as EventReviewSearchResultsDto

      const params: GetEventsForReviewParams = {
        prisonCode: 'MDI',
        requestDate: '2023-01-01',
        page: 0,
        pageSize: 10,
        prisonerNumbers: ['A1234AA'],
        filterAcknowledged: false,
        filterEventTypes: ['prisoner-offender-search.prisoner.alerts-updated'],
      }

      when(activitiesOrchestratorApiClient.getEventsForReview).mockResolvedValue(expectedResult)

      const actualResult = await activitiesOrchestratorService.getEventsForReview(params, user)

      expect(actualResult).toEqual(expectedResult)
      expect(activitiesOrchestratorApiClient.getEventsForReview).toHaveBeenCalledWith(params, user)
    })
  })
})
