export interface BankHolidayResponse {
  'england-and-wales': BankHolidayDivision
  scotland: BankHolidayDivision
  'northern-ireland': BankHolidayDivision
}

interface BankHolidayDivision {
  division: string
  events: BankHoliday[]
}

interface BankHoliday {
  title: string
  date: string
  notes: string
  bunting: boolean
}
