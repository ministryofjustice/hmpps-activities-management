import ActivitiesOrchestratorApiClient from '../data/activitiesOrchestratorApiClient'
import { ServiceUser } from '../@types/express'
import { EventReviewSearchResultsDto, GetEventsForReviewParams } from '../@types/activitiesOrchestratorAPI/types'

export default class ActivitiesOrchestratorService {
  constructor(private readonly activitiesOrchestratorApiClient: ActivitiesOrchestratorApiClient) {}

  async getEventsForReview(params: GetEventsForReviewParams, user: ServiceUser): Promise<EventReviewSearchResultsDto> {
    return this.activitiesOrchestratorApiClient.getEventsForReview(params, user)
  }
}
