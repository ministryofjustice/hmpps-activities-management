import { PrisonerAlert } from '../@types/prisonerOffenderSearchImport/types'
import { OffenderNonAssociationDetails } from '../@types/prisonApiImport/types'
import { AppointmentNonAssociation, AppointmentPrisoner } from '../@types/appointments'

export const getRelevantAppointmentAlerts = (alerts?: PrisonerAlert[]) => {
  const RELEVANT_ALERT_CODES = ['HA', 'XA', 'RCON', 'XEL', 'RNO121', 'PEEP', 'XRF', 'XSA', 'XTACT']

  return alerts
    ?.filter(alert => alert.active && !alert.expired && RELEVANT_ALERT_CODES.includes(alert.alertCode))
    .map(alert => ({ alertCode: alert.alertCode }))
}

export const getAppointmentPrisonerNonAssociations = (nonAssociationDetails?: OffenderNonAssociationDetails) => {
  return nonAssociationDetails?.nonAssociations?.map(
    na =>
      ({
        number: na.offenderNonAssociation.offenderNo,
        name: `${na.offenderNonAssociation.firstName} ${na.offenderNonAssociation.lastName}`,
        cellLocation: na.offenderNonAssociation.assignedLivingUnitDescription,
      } as AppointmentNonAssociation),
  )
}

export const getAppointmentPrisoners = (
  existingPrisoners: AppointmentPrisoner[],
  ...newPrisoners: AppointmentPrisoner[]
) => {
  const updatedPrisoners = existingPrisoners?.filter(p => !newPrisoners.map(np => np.number).includes(p.number)) ?? []

  newPrisoners.forEach(newPrisoner => {
    newPrisoner.nonAssociations?.forEach(na => {
      const allocatedPrisoner = existingPrisoners.find(p => p.number === na.number)
      if (allocatedPrisoner) {
        // eslint-disable-next-line no-param-reassign
        na.isAllocated = true
        let allocatedPrisonerNonAssociation = allocatedPrisoner.nonAssociations.find(apna => apna.number === na.number)
        if (!allocatedPrisonerNonAssociation) {
          allocatedPrisonerNonAssociation = {
            number: newPrisoner.number,
            name: newPrisoner.name,
            cellLocation: newPrisoner.cellLocation,
          } as AppointmentNonAssociation
          allocatedPrisoner.nonAssociations.push(allocatedPrisonerNonAssociation)
        }

        allocatedPrisonerNonAssociation.isAllocated = true
      }
    })

    updatedPrisoners.push(newPrisoner)
  })

  return updatedPrisoners
}
