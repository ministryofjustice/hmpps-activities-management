import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'
import { ServiceUser } from '../@types/express'
import { EventReviewSearchResultsDto } from '../@types/activitiesOrchestratorAPI/types'

const CASELOAD_HEADER = (caseloadId: string) => ({ 'Caseload-Id': caseloadId })

export default class ActivitiesOrchestratorApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Alerts API', config.apis.activitiesOrchestratorApi, logger, authenticationClient)
  }

  async getEventsForReview(
    prison: string,
    date: string,
    page: number,
    pageSize: number,
    user: ServiceUser,
  ): Promise<EventReviewSearchResultsDto> {
    return this.get(
      {
        path: `/event-review/prison/${prison}`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query: { date, page, size: pageSize },
      },
      asUser(user.token),
    )
  }
}
