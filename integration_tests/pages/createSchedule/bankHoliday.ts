import Page from '../page'

export default class BankHolidayPage extends Page {
  constructor() {
    super('create-schedule-bank-holiday-option-page')
  }

  runOnBankHoliday = (text: string) => this.getInputByLabel(text).click()
}
