import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import { Alert } from '../@types/alertsAPI/types'
import logger from '../../logger'

export default class AlertsApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Alerts API', config.apis.alertsApi, logger, authenticationClient)
  }

  async getAlertsForPrisoners(prisonerNumbers: string[]): Promise<{ content: Alert[] }> {
    return this.post(
      {
        path: `/search/alerts/prison-numbers`,
        query: { includeInactive: false },
        data: prisonerNumbers,
      },
      asSystem(),
    )
  }
}
