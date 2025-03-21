import {
  mapPrisonersAllocated,
  PrisonerAllocated,
  inmatesAllocated,
  inmatesWithMatchingIncentiveLevel,
  inmatesWithoutMatchingIncentiveLevel,
  addOtherAllocations,
  addNonAssociations,
  addPayBand,
} from './allocationUtil'
import { Inmate } from '../../routes/activities/manage-allocations/journey'
import { Activity, Allocation, PrisonerAllocations } from '../../@types/activitiesAPI/types'

describe('Allocation helper function tests', () => {
  const inmate1: Inmate = {
    prisonCode: 'ABC',
    prisonerName: 'jo bloggs',
    prisonerNumber: 'A11222A',
    status: 'Active',
    incentiveLevel: 'Standard',
  }
  const inmate2: Inmate = {
    prisonCode: 'ABC',
    prisonerName: 'jeff bloggs',
    prisonerNumber: 'B11232B',
    status: 'Active',
    incentiveLevel: 'Basic',
  }
  const allocation1: Allocation = {
    activityId: 0,
    activitySummary: '',
    bookingId: 0,
    exclusions: [],
    id: 0,
    isUnemployment: false,
    prisonerNumber: 'A11222A',
    scheduleDescription: '',
    scheduleId: 0,
    startDate: '',
    status: undefined,
  }
  const allocation2: Allocation = {
    activityId: 0,
    activitySummary: '',
    bookingId: 0,
    exclusions: [],
    id: 0,
    isUnemployment: false,
    prisonerNumber: 'B11232B',
    scheduleDescription: '',
    scheduleId: 0,
    startDate: '2024-01-01',
    status: undefined,
  }

  it('should map prisoners allocated where all allocated are present', () => {
    const prisonersAllocated: PrisonerAllocated[] = mapPrisonersAllocated(
      ['A11222A', 'B11232B'],
      ['A11222A', 'B11232B'],
    )
    const expectedPrisonersAllocated: PrisonerAllocated[] = [
      {
        prisonerNumber: 'A11222A',
        allocated: true,
      },
      {
        prisonerNumber: 'B11232B',
        allocated: true,
      },
    ]
    expect(prisonersAllocated).toEqual(expectedPrisonersAllocated)
  })

  it('should map prisoners allocated where some allocated are present', () => {
    const prisonersAllocated: PrisonerAllocated[] = mapPrisonersAllocated(['A11222A', 'B11232B'], ['A11222A'])
    const expectedPrisonersAllocated: PrisonerAllocated[] = [
      {
        prisonerNumber: 'A11222A',
        allocated: true,
      },
      {
        prisonerNumber: 'B11232B',
        allocated: false,
      },
    ]
    expect(prisonersAllocated).toEqual(expectedPrisonersAllocated)
  })

  it('should map prisoners not allocated where allocated array is empty', () => {
    const prisonersAllocated: PrisonerAllocated[] = mapPrisonersAllocated(['A11222A', 'B11232B'], [])
    const expectedPrisonersAllocated: PrisonerAllocated[] = [
      {
        prisonerNumber: 'A11222A',
        allocated: false,
      },
      {
        prisonerNumber: 'B11232B',
        allocated: false,
      },
    ]
    expect(prisonersAllocated).toEqual(expectedPrisonersAllocated)
  })

  it('should return empty where prisoner list array is empty', () => {
    const prisonersAllocated: PrisonerAllocated[] = mapPrisonersAllocated([], ['A11222A'])
    const expectedPrisonersAllocated: PrisonerAllocated[] = []
    expect(prisonersAllocated).toEqual(expectedPrisonersAllocated)
  })

  it('should return no inmates allocated where all allocated are present', () => {
    const unallocatedInmates: Inmate[] = inmatesAllocated([inmate1, inmate2], [allocation1, allocation2], true)
    const expectedInmatesUnallocated: Inmate[] = []
    expect(unallocatedInmates).toEqual(expectedInmatesUnallocated)
  })

  it('should return inmates allocated where some allocated are present', () => {
    const unallocatedInmates: Inmate[] = inmatesAllocated([inmate1, inmate2], [allocation1], true)
    const expectedInmatesUnallocated: Inmate[] = [inmate2]
    expect(unallocatedInmates).toEqual(expectedInmatesUnallocated)
  })

  it('should return inmates not allocated where allocated array is empty', () => {
    const unallocatedInmates: Inmate[] = inmatesAllocated([inmate1, inmate2], [], true)
    const expectedInmatesUnallocated: Inmate[] = [inmate1, inmate2]
    expect(unallocatedInmates).toEqual(expectedInmatesUnallocated)
  })

  it('should return inmates allocated where all allocated are present', () => {
    const allocatedInmates: Inmate[] = inmatesAllocated([inmate1, inmate2], [allocation1, allocation2], false)
    const expectedInmatesAllocated: Inmate[] = [inmate1, inmate2]
    expect(allocatedInmates).toEqual(expectedInmatesAllocated)
  })

  it('should return inmates allocated where some allocated are present', () => {
    const allocatedInmates: Inmate[] = inmatesAllocated([inmate1, inmate2], [allocation1], false)
    const expectedInmatesAllocated: Inmate[] = [inmate1]
    expect(allocatedInmates).toEqual(expectedInmatesAllocated)
  })

  it('should return inmates allocated where allocated array is empty', () => {
    const allocatedInmates: Inmate[] = inmatesAllocated([inmate1, inmate2], [], false)
    const expectedInmatesAllocated: Inmate[] = []
    expect(allocatedInmates).toEqual(expectedInmatesAllocated)
  })

  it('should return inmates where the incentive level matches', () => {
    const activity = {
      pay: [{ incentiveLevel: 'Standard' }, { incentiveLevel: 'Basic' }],
    } as Activity
    const matchingInmates: Inmate[] = inmatesWithMatchingIncentiveLevel([inmate1, inmate2], activity)
    expect(matchingInmates).toEqual([inmate1, inmate2])
  })

  it('should return one inmate where the incentive level matches one inmate', () => {
    const activity = {
      pay: [{ incentiveLevel: 'Standard' }],
    } as Activity
    const matchingInmates: Inmate[] = inmatesWithMatchingIncentiveLevel([inmate1, inmate2], activity)
    expect(matchingInmates).toEqual([inmate1])
  })

  it('should return no inmates where there is no matching inventive level', () => {
    const activity = {
      pay: [{ incentiveLevel: 'Enhanced' }],
    } as Activity
    const matchingInmates: Inmate[] = inmatesWithMatchingIncentiveLevel([inmate1, inmate2], activity)
    expect(matchingInmates).toEqual([])
  })

  it('should return no inmates where the incentive level matches', () => {
    const activity = {
      pay: [{ incentiveLevel: 'Standard' }, { incentiveLevel: 'Basic' }],
    } as Activity
    const withoutMatchingInmates: Inmate[] = inmatesWithoutMatchingIncentiveLevel([inmate1, inmate2], activity)
    expect(withoutMatchingInmates).toEqual([])
  })

  it('should return one inmate where the incentive level does not match one inmate', () => {
    const activity = {
      pay: [{ incentiveLevel: 'Basic' }],
    } as Activity
    const withoutMatchingInmates: Inmate[] = inmatesWithoutMatchingIncentiveLevel([inmate1, inmate2], activity)
    expect(withoutMatchingInmates).toEqual([inmate1])
  })

  it('should return 2 inmates where there is no matching inventive level', () => {
    const activity = {
      pay: [{ incentiveLevel: 'Enhanced' }],
    } as Activity
    const withoutMatchingInmates: Inmate[] = inmatesWithoutMatchingIncentiveLevel([inmate1, inmate2], activity)
    expect(withoutMatchingInmates).toEqual([inmate1, inmate2])
  })

  it('should add other allocations with same prison number and different schedule', () => {
    const prisonerAllocations: PrisonerAllocations[] = [
      {
        prisonerNumber: 'A11222A',
        allocations: [
          { activityId: 1, scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
          { activityId: 2, scheduleId: 2, scheduleDescription: 'other schedule', isUnemployment: false },
        ],
      },
      {
        prisonerNumber: 'B11222B',
        allocations: [
          { activityId: 1, scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
          { activityId: 2, scheduleId: 2, scheduleDescription: 'other schedule', isUnemployment: false },
        ],
      },
    ] as PrisonerAllocations[]

    addOtherAllocations([inmate1], prisonerAllocations, 3)
    expect(inmate1.otherAllocations).toHaveLength(2)
  })

  it('should add one other allocations with one same prison number and one different schedule', () => {
    const prisonerAllocations: PrisonerAllocations[] = [
      {
        prisonerNumber: 'A11222A',
        allocations: [
          { activityId: 1, scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
          { activityId: 2, scheduleId: 2, scheduleDescription: 'other schedule', isUnemployment: false },
        ],
      },
      {
        prisonerNumber: 'B11222B',
        allocations: [
          { activityId: 1, scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
          { activityId: 2, scheduleId: 2, scheduleDescription: 'other schedule', isUnemployment: false },
        ],
      },
    ] as PrisonerAllocations[]

    addOtherAllocations([inmate1], prisonerAllocations, 2)
    expect(inmate1.otherAllocations).toHaveLength(1)
  })

  it('should add add an empty array for allocations if none exist for the prisoner', () => {
    const prisonerAllocations: PrisonerAllocations[] = [
      {
        prisonerNumber: 'Z11222A',
        allocations: [
          { activityId: 1, scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
          { activityId: 2, scheduleId: 2, scheduleDescription: 'other schedule', isUnemployment: false },
        ],
      },
    ] as PrisonerAllocations[]

    addOtherAllocations([inmate1], prisonerAllocations, 2)
    expect(inmate1.otherAllocations).toHaveLength(0)
  })

  it('should set other non-associations to true for inmate when it has an inmate with a non-associations', () => {
    addNonAssociations([inmate1, inmate2], ['A11222A'])
    expect(inmate1.nonAssociations).toBe(true)
    expect(inmate2.nonAssociations).toBe(false)
  })

  it('should set other non-associations to false for inmate when it has no inmates with non-associations', () => {
    addNonAssociations([inmate1, inmate2], [])
    expect(inmate1.nonAssociations).toBe(false)
    expect(inmate2.nonAssociations).toBe(false)
  })
  it('should set empty pay rate if no payrates are provided', () => {
    const payBands = []

    addPayBand([inmate1], payBands)
    expect(inmate1.payBand).toEqual(undefined)
  })

  it('should set the appropriate pay band on the inmate', () => {
    const payBands = [
      {
        prisonerNumber: 'A11222A',
        payBandDetail: {
          bandId: 122,
          bandAlias: 'Some name',
          rate: 100,
        },
      },
      {
        prisonerNumber: 'B11232B',
        payBandDetail: {
          bandId: 444,
          bandAlias: 'Some other name',
          rate: 10,
        },
      },
    ]

    addPayBand([inmate1], payBands)
    expect(inmate1.payBand).toEqual({ id: 122, alias: 'Some name', rate: 100 })
  })
})
