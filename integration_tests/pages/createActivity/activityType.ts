import Page from '../page'

export default class ActivityTypePage extends Page {
  constructor() {
    super('activity-type-page')
  }

  selectInternalType = () => this.getInputByLabel('In-prison activity').click()

  selectExternalType = () => this.getInputByLabel('Outside activity').click()
}
