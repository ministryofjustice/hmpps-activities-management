import { PrisonPayBand } from '../../../../@types/activitiesAPI/types'
import { activityHasPayBand } from './suspendUtils'

describe('activityHasPayBand', () => {
  it('Multiple allocations - some paid', () => {
    const allocations = [
      {
        activityId: 1,
        allocationId: 2,
        activityName: 'Activity 1',
        payBand: {
          id: 11,
          alias: 'Low',
          description: 'Pay band 1 (Lowest)',
          nomisPayBand: 1,
          prisonCode: 'MDI',
        } as PrisonPayBand,
      },
      {
        activityId: 11,
        allocationId: 12,
        activityName: 'Activity 2',
        payBand: null,
      },
      {
        activityId: 11,
        allocationId: 12,
        activityName: 'Activity 2',
        payBand: {
          id: 12,
          alias: 'High',
          description: 'Pay band 2 (Lowest)',
          nomisPayBand: 2,
          prisonCode: 'MDI',
        } as PrisonPayBand,
      },
    ]
    const result = activityHasPayBand(allocations)
    expect(result).toEqual(true)
  })
  it('Multiple allocations - none paid', () => {
    const allocations = [
      {
        activityId: 11,
        allocationId: 12,
        activityName: 'Activity 2',
        payBand: null,
      },
      {
        activityId: 12,
        allocationId: 13,
        activityName: 'Activity 4',
        payBand: null,
      },
    ]
    const result = activityHasPayBand(allocations)
    expect(result).toEqual(false)
  })
  it('One allocation - not paid', () => {
    const allocations = [
      {
        activityId: 11,
        allocationId: 12,
        activityName: 'Activity 2',
        payBand: null,
      },
    ]
    const result = activityHasPayBand(allocations)
    expect(result).toEqual(false)
  })
  it('One allocation - paid', () => {
    const allocations = [
      {
        activityId: 11,
        allocationId: 12,
        activityName: 'Activity 2',
        payBand: {
          id: 12,
          alias: 'High',
          description: 'Pay band 2 (Lowest)',
          nomisPayBand: 2,
          prisonCode: 'MDI',
        } as PrisonPayBand,
      },
    ]
    const result = activityHasPayBand(allocations)
    expect(result).toEqual(true)
  })
})
