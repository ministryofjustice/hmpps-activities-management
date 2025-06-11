import { ServiceUser } from '../@types/express'
import BankHolidaysClient from '../data/bankHolidaysClient'
import TokenStoreInterface from '../data/tokenStoreInterface'

export default class BankHolidayService {
  constructor(
    private readonly bankHolidaysClient: BankHolidaysClient,
    private readonly store: TokenStoreInterface,
  ) {}

  async getUkBankHolidays(division: string, user: ServiceUser): Promise<Date[]> {
    const cached = await this.store.getToken(`${division}.bankHolidays`)
    if (cached) {
      return JSON.parse(cached).events.map(event => new Date(event.date))
    }

    const bankHolidays = await this.bankHolidaysClient
      .getBankHolidays(user)
      .then(response => response[division].events.map(event => new Date(event.date)))

    await this.store.setToken(
      `${division}.bankHolidays`,
      JSON.stringify({ events: bankHolidays.map(date => ({ date })) }),
      60 * 60 * 24 * 7, // Cache for 7 Days
    )

    return bankHolidays
  }
}
