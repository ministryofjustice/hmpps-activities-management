import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import { ServiceUser } from '../@types/express'
import { Alert } from '../@types/alertsAPI/types'
import logger from '../../logger'

export default class AlertsApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Alerts API', config.apis.alertsApi, logger, authenticationClient)
  }

  async getAlertsForPrisoners(prisonerNumbers: string[], user: ServiceUser): Promise<{ content: Alert[] }> {
    return this.post(
      {
        path: `/search/alerts/prison-numbers`,
        query: { includeInactive: false },
        data: prisonerNumbers,
      },
      asUser(user.token),
    )
  }
}
