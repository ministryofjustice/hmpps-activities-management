import { CandidateListTableRow } from '../../../../../@types/activities'
import { InmateBasicDetails } from '../../../../../@types/prisonApiImport/types'

// eslint-disable-next-line import/prefer-default-export
export const mapToTableRow = (prisoner: InmateBasicDetails): CandidateListTableRow => {
  return {
    name: `${prisoner.firstName} ${prisoner.lastName}`,
    prisonNumber: prisoner.offenderNo,
    location: prisoner.assignedLivingUnitDesc,
    incentiveLevel: '',
    alerts: [],
  }
}
