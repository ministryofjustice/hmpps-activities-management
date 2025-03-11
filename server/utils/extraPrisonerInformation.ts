import { PrisonerAllocations } from '../@types/activitiesAPI/types'
import { Prisoner } from '../@types/prisonerOffenderSearchImport/types'

export default function enhancePrisonersWithNonAssocationsAndAllocations(
  prisoners: Prisoner[],
  prisonerAllocations: PrisonerAllocations[],
  prisonersWithNonAssociations: string[],
) {
  return prisoners.map(prisoner => {
    const [allocations] = prisonerAllocations.filter(person => prisoner.prisonerNumber === person.prisonerNumber)

    return {
      ...prisoner,
      allocations: allocations?.allocations || [],
      nonAssociations: prisonersWithNonAssociations.includes(prisoner.prisonerNumber),
    }
  })
}
