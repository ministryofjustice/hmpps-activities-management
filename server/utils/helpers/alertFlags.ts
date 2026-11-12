import { getAlertFlagLabelsForAlerts } from '@ministryofjustice/hmpps-connect-dps-shared-items'

import type { AlertFlagLabel, BasicAlert } from '@ministryofjustice/hmpps-connect-dps-shared-items'

export const getAlertFlagsFromCodes = (alertCodes: string[]): AlertFlagLabel[] => {
  const alerts: BasicAlert[] = alertCodes.map(code => ({
    alertCode: code,
    alertType: '',
    active: true,
    expired: false,
  }))

  return getAlertFlagLabelsForAlerts(alerts)
}

export default getAlertFlagsFromCodes
