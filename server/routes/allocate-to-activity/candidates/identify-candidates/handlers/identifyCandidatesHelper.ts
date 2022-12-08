import { CandidateListTableRow } from '../../../../../@types/activities'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'

// eslint-disable-next-line import/prefer-default-export
export const mapToTableRow = (prisoner: Prisoner): CandidateListTableRow => {
  return {
    name: `${prisoner.lastName.charAt(0) + prisoner.lastName.substring(1).toLowerCase()}, ${
      prisoner.firstName.charAt(0) + prisoner.firstName.substring(1).toLowerCase()
    }`,
    prisonNumber: prisoner.prisonerNumber,
    location: prisoner.cellLocation,
    incentiveLevel: prisoner.currentIncentive.level.description,
    alerts: prisoner.alerts.filter(a => a.active && !a.expired).map(a => a.alertCode),
  }
}
