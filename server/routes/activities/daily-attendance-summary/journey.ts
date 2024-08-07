import { PayNoPay } from '../../../@types/activities'

export type AttendanceSummaryJourney = {
  searchTerm?: string
  categoryFilters?: string[]
  absenceReasonFilters?: string[]
  reasonFilter?: string
  payFilters?: PayNoPay[]
}
