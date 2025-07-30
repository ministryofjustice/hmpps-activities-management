import Page from '../page'

export default class DeallocateTodayOptionPage extends Page {
  constructor() {
    super('deallocate-today-option-page')
  }

  selectDeallocateToday = () => this.getInputById('deallocateTodayOption').click()

  selectDeallocateEndOfDay = () => this.getInputById('deallocateTodayOption-2').click()

  selectDeallocateInFuture = () => this.getInputById('deallocateTodayOption-3').click()
}
