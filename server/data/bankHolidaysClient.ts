import AbstractHmppsRestClient from './abstractHmppsRestClient'
import config, { ApiConfig } from '../config'
import { ServiceUser } from '../@types/express'
import type { BankHolidayResponse } from '../@types/ukBankHolidays'

export default class BankHolidaysClient extends AbstractHmppsRestClient {
  constructor() {
    super('Bank Holidays API', config.apis.bankHolidaysApi as ApiConfig)
  }

  async getBankHolidays(user: ServiceUser): Promise<{ content: BankHolidayResponse }> {
    return this.get({ path: '' }, user)
  }
}
