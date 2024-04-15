import { PrisonerAlert } from '../@types/prisonerOffenderSearchImport/types'

export type AlertFilterOption = {
  key: string
  description: string
  codes: string[]
}
export default class AlertsFilterService {
  private readonly ALERT_FILTERS: AlertFilterOption[] = [
    { key: 'ALERT_HA', description: 'ACCT', codes: ['HA'] },
    { key: 'ALERT_XCU', description: 'Controlled unlock', codes: ['XCU'] },
    { key: 'ALERT_XEL', description: 'Escape list', codes: ['XEL'] },
    { key: 'ALERT_PEEP', description: 'PEEP', codes: ['PEEP'] },
  ]

  private readonly CATEGORY_FILTERS: AlertFilterOption[] = [
    { key: 'CAT_A', description: 'Category A', codes: ['A', 'E'] },
    { key: 'CAT_A_HIGHER', description: 'Category A - high', codes: ['H'] },
    { key: 'CAT_A_PROVISIONAL', description: 'Category A - provisional', codes: ['P'] },
  ]

  getAllAlertFilterOptions(): AlertFilterOption[] {
    return this.ALERT_FILTERS.concat(this.CATEGORY_FILTERS)
  }

  getFilteredAlerts(alertFilters: string[], prisonerAlerts?: PrisonerAlert[]): PrisonerAlert[] {
    return prisonerAlerts?.filter(a =>
      this.ALERT_FILTERS.filter(af => alertFilters.includes(af.key))
        .flatMap(alert => alert.codes)
        .includes(a.alertCode),
    )
  }

  getFilteredCategory(alertFilters: string[], category?: string): string {
    return this.CATEGORY_FILTERS.filter(cat => alertFilters.includes(cat.key))
      .flatMap(cat => cat.codes)
      .find(cat => cat === category)
  }
}
