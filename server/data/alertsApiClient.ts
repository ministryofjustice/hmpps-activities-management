import AbstractHmppsRestClient from './abstractHmppsRestClient'
import config, { ApiConfig } from '../config'
import { ServiceUser } from '../@types/express'
import { Alert } from '../@types/alertsAPI/types'

export default class AlertsApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Alerts API', config.apis.alertsApi as ApiConfig)
  }

  async getAlertsForPrisoners(prisonerNumbers: string[], user: ServiceUser): Promise<{ content: Alert[] }> {
    return this.post(
      {
        path: `/search/alerts/prison-numbers`,
        data: prisonerNumbers,
      },
      user,
    )
  }
}
