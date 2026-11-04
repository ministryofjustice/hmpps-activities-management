import ActivitiesOrchestratorApiClient from '../data/activitiesOrchestratorApiClient'
import { ServiceUser } from '../@types/express'
import { EventReviewSearchResultsDto } from '../@types/activitiesOrchestratorAPI/types'

export default class ActivitiesOrchestratorService {
  constructor(private readonly activitiesOrchestratorApiClient: ActivitiesOrchestratorApiClient) {}

  async getEventsForReview(
    prisonCode: string,
    requestDate: string,
    page: number,
    pageSize: number,
    user: ServiceUser,
  ): Promise<EventReviewSearchResultsDto> {
    return this.activitiesOrchestratorApiClient.getEventsForReview(prisonCode, requestDate, page, pageSize, user)
  }
}
