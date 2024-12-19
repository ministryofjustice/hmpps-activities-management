import { startOfToday } from 'date-fns'
import { parseISODate } from '../utils'
import { Activity, Allocation } from '../../@types/activitiesAPI/types'
import { Prisoner } from '../../@types/prisonerOffenderSearchImport/types'

export default function getCurrentPay(activity: Activity, allocation: Allocation, prisoner: Prisoner) {
  return activity.pay
    .filter(
      a =>
        a.prisonPayBand.id === allocation.prisonPayBand.id &&
        a.incentiveLevel === prisoner.currentIncentive?.level?.description &&
        (a.startDate == null || parseISODate(a.startDate) <= startOfToday()),
    )
    .sort(
      (a, b) =>
        (parseISODate(a.startDate) == null ? 0 : parseISODate(a.startDate).valueOf()) -
        (parseISODate(b.startDate) == null ? 0 : parseISODate(b.startDate).valueOf()),
    )
    .pop()
}
