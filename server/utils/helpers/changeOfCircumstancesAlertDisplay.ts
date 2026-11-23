import { getAlertFlagLabelsForAlerts } from '@ministryofjustice/hmpps-connect-dps-shared-items'

import type { AlertFlagLabel, BasicAlert } from '@ministryofjustice/hmpps-connect-dps-shared-items'

export type AlertDisplay = {
  flags: AlertFlagLabel[]
  descriptions: string[]
}

const getFlags = (alertCodes: string[]): AlertFlagLabel[] => {
  const alerts: BasicAlert[] = alertCodes.map(code => ({
    alertCode: code,
    alertType: '',
    active: true,
    expired: false,
  }))

  return getAlertFlagLabelsForAlerts(alerts)
}

export const getFlaggedAlertCodes = (alertCodes: string[]): string[] => {
  return getFlags(alertCodes).flatMap(flag => flag.alertCodes)
}

export const getAlertDisplay = (alertCodes: string[], descriptionMap: Map<string, string>): AlertDisplay => {
  const flags = getFlags(alertCodes)

  const flaggedCodes = new Set(flags.flatMap(flag => flag.alertCodes))

  const descriptions = alertCodes.filter(code => !flaggedCodes.has(code)).map(code => descriptionMap.get(code) ?? code)

  return {
    flags,
    descriptions,
  }
}
