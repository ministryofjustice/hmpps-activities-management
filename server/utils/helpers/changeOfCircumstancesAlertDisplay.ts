import { getAlertFlagLabelsForAlerts } from '@ministryofjustice/hmpps-connect-dps-shared-items'

import type { AlertFlagLabel, BasicAlert } from '@ministryofjustice/hmpps-connect-dps-shared-items'

export type AlertDisplay = {
  flags: AlertFlagLabel[]
  descriptions: string[]
}

export const getAlertDisplay = (alertCodes: string[], descriptionMap: Map<string, string>): AlertDisplay => {
  const alerts: BasicAlert[] = alertCodes.map(code => ({
    alertCode: code,
    alertType: '',
    active: true,
    expired: false,
  }))
  const flags = getAlertFlagLabelsForAlerts(alerts)

  const flaggedCodes = new Set(flags.flatMap(flag => flag.alertCodes))

  const descriptions = alertCodes.filter(code => !flaggedCodes.has(code)).map(code => descriptionMap.get(code) ?? code)

  return {
    flags,
    descriptions,
  }
}
