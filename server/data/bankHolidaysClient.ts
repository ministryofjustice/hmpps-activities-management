import { RestClient } from '@ministryofjustice/hmpps-rest-client'
import logger from '../../logger'
import config from '../config'
import type { BankHolidayResponse } from '../@types/ukBankHolidays'

export default class BankHolidaysClient extends RestClient {
  constructor() {
    super('Bank Holidays API', config.apis.bankHolidaysApi, logger)
  }

  async getBankHolidays(): Promise<BankHolidayResponse> {
    return this.get({ path: '' })
  }
}
