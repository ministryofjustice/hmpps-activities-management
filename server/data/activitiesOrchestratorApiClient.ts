import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'
import { ServiceUser } from '../@types/express'
import { EventReviewSearchResultsDto, GetEventsForReviewParams } from '../@types/activitiesOrchestratorAPI/types'

const CASELOAD_HEADER = (caseloadId: string) => ({ 'Caseload-Id': caseloadId })

export default class ActivitiesOrchestratorApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Orchestrator API', config.apis.activitiesOrchestratorApi, logger, authenticationClient)
  }

  async getEventsForReview(params: GetEventsForReviewParams, user: ServiceUser): Promise<EventReviewSearchResultsDto> {
    return this.get(
      {
        path: `/event-review/prison/${params.prisonCode}`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query: {
          date: params.requestDate,
          prisonerNumbers: params.prisonerNumbers,
          filterAcknowledged: params.filterAcknowledged,
          filterEventTypes: params.filterEventTypes,
          page: params.page,
          size: params.pageSize,
        },
      },
      asUser(user.token),
    )
  }
}
