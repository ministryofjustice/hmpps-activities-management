import { YesNo } from '../../../@types/activities'

export type MovementListJourney = {
  dateOption?: string
  date?: string
  timeSlot?: string
  alertFilters?: string[]
  cancelledEventsFilter?: YesNo
}
