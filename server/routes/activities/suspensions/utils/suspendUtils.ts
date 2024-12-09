import { PrisonPayBand } from '../../../../@types/activitiesAPI/types'

// eslint-disable-next-line import/prefer-default-export
export const activityHasPayBand = (
  allocations: {
    activityId: number
    allocationId: number
    activityName: string
    payBand: PrisonPayBand
  }[],
): boolean => {
  if (allocations?.length > 1) {
    return !!allocations.filter(al => al.payBand).length
  }
  return !!allocations[0].payBand
}
