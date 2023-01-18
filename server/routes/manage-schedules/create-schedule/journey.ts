export type CreateScheduleJourney = {
  name?: string
  startDate?: string
  endDateOption?: string
  endDate?: string
  days?: string[]
  timeSlotsMonday?: string[]
  timeSlotsTuesday?: string[]
  timeSlotsWednesday?: string[]
  timeSlotsThursday?: string[]
  timeSlotsFriday?: string[]
  timeSlotsSaturday?: string[]
  timeSlotsSunday?: string[]
  location?: {
    id: number
    name: string
  }
  capacity?: number
}
