import { PrisonerAllocations } from '../@types/activitiesAPI/types'
import { Prisoner } from '../@types/prisonerOffenderSearchImport/types'
import enhancePrisonersWithNonAssocationsAndAllocations from './extraPrisonerInformation'

const prisonerOne = { prisonerNumber: 'G0995GW' }
const prisonerTwo = { prisonerNumber: 'A123VU' }

describe('Extra prisoner information', () => {
  it('Empty inputs', () => {
    const result = enhancePrisonersWithNonAssocationsAndAllocations([], [], [])
    expect(result).toStrictEqual([])
  })
  it('Matching allocations and non associations present', () => {
    const prisoners = [prisonerOne] as Prisoner[]
    const allocations = [
      {
        prisonerNumber: prisonerOne.prisonerNumber,
        allocations: [{ id: 1, prisonerNumber: prisonerOne.prisonerNumber }],
      },
    ] as PrisonerAllocations[]
    const nonAssociations = [prisonerOne.prisonerNumber]
    const result = enhancePrisonersWithNonAssocationsAndAllocations(prisoners, allocations, nonAssociations)
    expect(result).toStrictEqual([
      {
        prisonerNumber: 'G0995GW',
        allocations: [{ id: 1, prisonerNumber: prisonerOne.prisonerNumber }],
        nonAssociations: true,
      },
    ])
  })
  it('Matching allocation and non-associations present for one of two', () => {
    const prisoners = [prisonerOne, prisonerTwo] as Prisoner[]
    const allocations = [
      {
        prisonerNumber: prisonerOne.prisonerNumber,
        allocations: [{ id: 1, prisonerNumber: prisonerOne.prisonerNumber }],
      },
    ] as PrisonerAllocations[]
    const nonAssociations = [prisonerOne.prisonerNumber]
    const result = enhancePrisonersWithNonAssocationsAndAllocations(prisoners, allocations, nonAssociations)
    expect(result).toStrictEqual([
      {
        prisonerNumber: prisonerOne.prisonerNumber,
        allocations: [{ id: 1, prisonerNumber: prisonerOne.prisonerNumber }],
        nonAssociations: true,
      },
      {
        prisonerNumber: prisonerTwo.prisonerNumber,
        allocations: [],
        nonAssociations: false,
      },
    ])
  })
  it('No matching allocations or non-associations', () => {
    const prisoners = [prisonerOne, prisonerTwo] as Prisoner[]
    const allocations = [
      {
        prisonerNumber: prisonerOne.prisonerNumber,
        allocations: [],
      },
      {
        prisonerNumber: prisonerTwo.prisonerNumber,
        allocations: [],
      },
    ] as PrisonerAllocations[]
    const nonAssociations = []
    const result = enhancePrisonersWithNonAssocationsAndAllocations(prisoners, allocations, nonAssociations)
    expect(result).toStrictEqual([
      {
        prisonerNumber: prisonerOne.prisonerNumber,
        allocations: [],
        nonAssociations: false,
      },
      {
        prisonerNumber: prisonerTwo.prisonerNumber,
        allocations: [],
        nonAssociations: false,
      },
    ])
  })
})
