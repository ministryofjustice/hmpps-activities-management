import { PrisonerAlert } from '../@types/prisonerOffenderSearchImport/types'
import { OffenderNonAssociationDetails } from '../@types/prisonApiImport/types'

export const getRelevantAppointmentAlerts = (alerts?: PrisonerAlert[]) => {
  const RELEVANT_ALERT_CODES = ['HA', 'XA', 'RCON', 'XEL', 'RNO121', 'PEEP', 'XRF', 'XSA', 'XTACT']

  return alerts
    ?.filter(alert => alert.active && !alert.expired && RELEVANT_ALERT_CODES.includes(alert.alertCode))
    .map(alert => ({ alertCode: alert.alertCode }))
}

export const getAppointmentNonAssociations = (nonAssociationDetails?: OffenderNonAssociationDetails) => {
  return nonAssociationDetails?.nonAssociations?.map(na => ({
    number: na.offenderNonAssociation.offenderNo,
    name: `${na.offenderNonAssociation.firstName} ${na.offenderNonAssociation.lastName}`,
    cellLocation: na.offenderNonAssociation.assignedLivingUnitDescription,
  }))
}
