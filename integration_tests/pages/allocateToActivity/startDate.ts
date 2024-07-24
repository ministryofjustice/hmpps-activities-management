import Page from '../page'

export default class StartDatePage extends Page {
  constructor() {
    super('allocation-start-date-page')
  }

  selectNextSession = () => this.getInputByLabel('The next session').click()

  selectADifferentDate = () => this.getInputByLabel('A different date').click()
}
