import { Alert } from '../@types/prisonApiImport/types'
import { ServiceUser } from '../@types/express'
import PrisonService from './prisonService'

export default class PrisonerAlertsService {
  constructor(private readonly prisonService: PrisonService) {}

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

  private fetchRelevantPrisonerAlerts(
    offenderNumbers: string[],
    prisonCode: string,
    user: ServiceUser,
  ): Promise<Alert[]> {
    return this.prisonService
      .getPrisonerAlerts(offenderNumbers, prisonCode, user)
      .then(a => a.filter(alert => !alert.expired && alert.active))
  }

  async getAlertDetails(
    prisoners: PrisonerDetails[],
    prisonCode: string,
    user: ServiceUser,
  ): Promise<PrisonerAlertResults> {
    const offenderNumbers: string[] = prisoners.map(prisoner => prisoner.number)

    const allAlertsForAllPrisoners: Alert[] = await this.fetchRelevantPrisonerAlerts(offenderNumbers, prisonCode, user)

    const prisonersWithAlerts: PrisonerAlertDetails[] = []
    let numPrisonersWithAlerts = 0

    prisoners.forEach(prisoner => {
      const relevantAlerts = allAlertsForAllPrisoners.filter(alert => alert.offenderNo === prisoner.number)

      const prisonerAlerts = relevantAlerts.map(a => ({ alertCode: a.alertCode }))

      const prisonerAlertDescriptions = relevantAlerts
        .map(alert => alert.alertCodeDescription)
        .sort((a, b) => a.localeCompare(b))

      const hasRelevantCategories = this.categoriesWithBadges.has(prisoner.category)

      if (prisonerAlerts.length > 0) {
        numPrisonersWithAlerts += 1
      }

      prisonersWithAlerts.push({
        ...prisoner,
        alerts: prisonerAlerts,
        alertDescriptions: prisonerAlertDescriptions,
        hasRelevantCategories,
        hasBadgeAlerts:
          hasRelevantCategories || relevantAlerts.some(alert => this.alertsWithBadges.has(alert.alertCode)),
      })
    })

    prisonersWithAlerts.sort((a, b) => (a.alerts.length > b.alerts.length ? -1 : 1))

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
