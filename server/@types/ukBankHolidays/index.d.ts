export interface BankHolidayResponse {
  'england-and-wales': BankHolidayDivision
  scotland: BankHolidayDivision
  'northern-ireland': BankHolidayDivision
}

export interface BankHolidayDivision {
  division: string
  events: BankHoliday[]
}

export interface BankHoliday {
  title: string
  date: string
  notes: string
  bunting: boolean
}
