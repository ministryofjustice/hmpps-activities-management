import HolidayFeed from '@hmcts/uk-bank-holidays'

export default class BankHolidayService extends HolidayFeed {
  constructor() {
    super(['england-and-wales'])
  }

  async getUkBankHolidays(): Promise<Date[]> {
    return super.load().then(dates => dates.map(date => new Date(date)))
  }
}
