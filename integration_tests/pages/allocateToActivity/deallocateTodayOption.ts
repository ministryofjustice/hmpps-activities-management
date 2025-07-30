import Page from '../page'

export default class DeallocateTodayOptionPage extends Page {
  constructor() {
    super('deallocate-today-option-page')
  }

  selectDeallocateToday = () => this.getInputByLabel('Now - they will be removed from any sessions later today').click()

  selectDeallocateEndOfDay = () => this.getInputByLabel('At the end of today').click()

  selectDeallocateInFuture = () => this.getInputByLabel('On a different date').click()
}
