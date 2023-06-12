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
        name: `${na.offenderNonAssociation.firstName} ${na.offenderNonAssociation.lastName}`,
        number: na.offenderNonAssociation.offenderNo,
        cellLocation: na.offenderNonAssociation.assignedLivingUnitDescription,
      } as AppointmentNonAssociation),
  )
}

export const getAppointmentPrisonersAdd = (
  existingPrisoners: AppointmentPrisoner[],
  ...prisonersToAdd: AppointmentPrisoner[]
) => {
  const updatedPrisoners = (
    existingPrisoners?.filter(p => !prisonersToAdd.map(np => np.number).includes(p.number)) ?? []
  ).concat(prisonersToAdd)

  // Loop through each prisoner
  updatedPrisoners.forEach(prisoner => {
    // Loop through each of their non associations
    prisoner.nonAssociations?.forEach(na => {
      // Find the non associated prisoner in the existing list if it exists. Prisoner a's non association with prisoner b
      const allocatedPrisoner = updatedPrisoners.find(p => p.number === na.number)
      if (allocatedPrisoner) {
        // Mark the non association as a key non association. This will highlight it in the UI
        // eslint-disable-next-line no-param-reassign
        na.isAllocated = true

        // Find the inverse non association. Prisoner b's non association with prisoner a
        let allocatedPrisonerNonAssociation = allocatedPrisoner.nonAssociations.find(
          apna => apna.number === prisoner.number,
        )
        if (!allocatedPrisonerNonAssociation) {
          // If the inverse non association doesn't exist, create it
          allocatedPrisonerNonAssociation = {
            name: prisoner.name,
            number: prisoner.number,
            cellLocation: prisoner.cellLocation,
          } as AppointmentNonAssociation
          allocatedPrisoner.nonAssociations.push(allocatedPrisonerNonAssociation)
        }

        // Mark the inverse non association as a key non association. This will highlight it in the UI
        allocatedPrisonerNonAssociation.isAllocated = true
      }
    })
  })

  return updatedPrisoners
}

export const getAppointmentPrisonersRemove = (
  existingPrisoners: AppointmentPrisoner[],
  ...prisonersToRemove: AppointmentPrisoner[]
) => {
  const prisonNumberToRemove = prisonersToRemove.map(np => np.number)
  const updatedPrisoners = existingPrisoners?.filter(p => !prisonNumberToRemove.includes(p.number)) ?? []

  updatedPrisoners.forEach(prisoner => {
    prisoner.nonAssociations
      ?.filter(na => prisonNumberToRemove.includes(na.number))
      .forEach(na => {
        // eslint-disable-next-line no-param-reassign
        na.isAllocated = false
      })
  })

  return updatedPrisoners
}
