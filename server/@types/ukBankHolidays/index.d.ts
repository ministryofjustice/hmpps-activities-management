declare module '@hmcts/uk-bank-holidays' {
  export default class HolidayFeed {
    constructor(divisions: string[])

    async load(): Promise<string[]>
  }
}

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
