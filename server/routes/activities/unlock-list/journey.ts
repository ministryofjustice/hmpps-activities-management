import { YesNo } from '../../../@types/activities'

export type UnlockListJourney = {
  timeSlot?: string
  locationKey?: string
  subLocationFilters?: string[]
  activityCategoriesFilters?: string[]
  activityFilter?: string
  stayingOrLeavingFilter?: string
  alertFilters?: string[]
  searchTerm?: string
  cancelledEventsFilter?: YesNo
}
