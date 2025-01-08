import { Alert } from '../@types/alertsAPI/types'
import { ServiceUser } from '../@types/express'
import AlertsApiClient from '../data/alertsApiClient'

export default class AlertsService {
  constructor(private readonly alertsApiClient: AlertsApiClient) {}

  async getAlertsUsingPrisonerNumbers(prisonerNumbers: string[], user: ServiceUser): Promise<Alert[]> {
    return this.alertsApiClient.getAlertsForPrisoners(prisonerNumbers, user)
  }
}
