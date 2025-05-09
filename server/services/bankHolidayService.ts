import { ServiceUser } from '../@types/express'
import BankHolidaysClient from '../data/bankHolidaysClient'

export default class BankHolidayService {
  constructor(private readonly bankHolidaysClient: BankHolidaysClient) {}

  async getUkBankHolidays(division: string, user: ServiceUser): Promise<Date[]> {
    return this.bankHolidaysClient
      .getBankHolidays(user)
      .then(response => response[division].events.map(event => new Date(event.date)))
  }
}
