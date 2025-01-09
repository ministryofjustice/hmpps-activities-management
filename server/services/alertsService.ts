import { Alert } from '../@types/alertsAPI/types'
import { ServiceUser } from '../@types/express'
import AlertsApiClient from '../data/alertsApiClient'

export default class AlertsService {
  constructor(private readonly alertsApiClient: AlertsApiClient) {}

  /*
  We need to know which prisoner has badged alerts to determine how to display this text list
   */
  readonly alertsWithBadges: Set<string> = new Set<string>([
    'HA',
    'HA1',
    'XSA',
    'XA',
    'PEEP',
    'XEL',
    'XRF',
    'XTACT',
    'XCO',
    'XCA',
    'XCI',
    'XR',
    'RTP',
    'RLG',
    'XHT',
    'XCU',
    'XGANG',
    'CSIP',
    'F1',
    'LCE',
    'RNO121',
    'RCON',
    'RCDR',
    'URCU',
    'UPIU',
    'USU',
    'URS',
    'PVN',
    'SA',
    'RKS',
    'VIP',
    'HID',
  ])

  readonly categoriesWithBadges: Set<string> = new Set<string>(['A', 'E', 'H', 'P'])

  async getAlertsUsingPrisonerNumbers(prisonerNumbers: string[], user: ServiceUser): Promise<Alert[]> {
    return this.alertsApiClient
      .getAlertsForPrisoners(prisonerNumbers, user)
      .then(a => a.content.filter(alert => alert.isActive))
  }

  async getAlertDetails(prisoners: PrisonerDetails[], user: ServiceUser): Promise<PrisonerAlertResults> {
    const prisonerNumbers: string[] = prisoners.map(prisoner => prisoner.number)

    const allAlertsForAllPrisoners: Alert[] = await this.getAlertsUsingPrisonerNumbers(prisonerNumbers, user)

    const prisonersWithAlerts: PrisonerAlertDetails[] = []
    let numPrisonersWithAlerts = 0

    prisoners.forEach(prisoner => {
      const relevantAlerts = allAlertsForAllPrisoners.filter(alert => alert.prisonNumber === prisoner.number)

      const prisonerAlerts = relevantAlerts.map(a => ({ alertCode: a.alertCode.code }))

      const prisonerAlertDescriptions = relevantAlerts
        .map(alert => alert.alertCode.description)
        .sort((a, b) => a.localeCompare(b))

      const isCategoryRelevant = this.categoriesWithBadges.has(prisoner.category)

      if (prisonerAlerts.length > 0) {
        numPrisonersWithAlerts += 1
      }

      prisonersWithAlerts.push({
        ...prisoner,
        alerts: prisonerAlerts,
        alertDescriptions: prisonerAlertDescriptions,
        hasRelevantCategories: isCategoryRelevant,
        hasBadgeAlerts:
          isCategoryRelevant || relevantAlerts.some(alert => this.alertsWithBadges.has(alert.alertCode.code)),
      })
    })

    prisonersWithAlerts.sort((a, b) => {
      if (a.alerts.length === b.alerts.length) {
        if (a.hasBadgeAlerts === b.hasBadgeAlerts) {
          return 0
        }
        return a.hasBadgeAlerts ? -1 : 1
      }
      return a.alerts.length > b.alerts.length ? -1 : 1
    })

    return {
      numPrisonersWithAlerts,
      prisoners: prisonersWithAlerts,
    }
  }
}

export type PrisonerDetails = {
  number: string
  name: string
  category?: string
}

export type PrisonerAlertDetails = PrisonerDetails & {
  alerts: {
    alertCode: string
  }[]
  alertDescriptions: string[]
  hasBadgeAlerts: boolean
  hasRelevantCategories: boolean
}

export type PrisonerAlertResults = {
  numPrisonersWithAlerts: number
  prisoners: PrisonerDetails[]
}
