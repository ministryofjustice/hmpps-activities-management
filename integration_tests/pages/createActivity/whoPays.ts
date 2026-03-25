import Page from '../page'

export default class WhoPaysPage extends Page {
  constructor() {
    super('who-pays-page')
  }

  selectInternalType = () => this.getInputByLabel('The prison').click()

  selectExternalType = () => this.getInputByLabel('An external employer').click()
}
