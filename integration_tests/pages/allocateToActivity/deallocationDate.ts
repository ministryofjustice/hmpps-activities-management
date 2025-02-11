import Page from '../page'

export default class DeallocationDatePage extends Page {
  constructor() {
    super('deallocate-after-allocation-date-page')
  }

  selectNow = () => this.getInputByLabel('Now').click()

  selectToday = () => this.getInputByLabel('At the end of today').click()

  selectADifferentDate = () =>
    this.getInputByLabel("At the end of a different day - they'll attend sessions that day, then be removed").click()
}
