import Page from '../page'

export default class DeallocateTodayOptionPage extends Page {
  constructor() {
    super('deallocate-today-option-page')
  }

  selectDeallocateToday = () => this.getInputByLabel('Remove them now').click()

  selectDeallocateInFuture = () => this.getInputByLabel('Set the day').click()
}
