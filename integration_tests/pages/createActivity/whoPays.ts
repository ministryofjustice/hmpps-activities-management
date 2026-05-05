import Page from '../page'

export default class WhoPaysPage extends Page {
  constructor() {
    super('who-pays-page')
  }

  selectPrison = () => this.getInputById('whoPays').click()

  selectExternalPayer = () => this.getInputById('whoPays-2').click()
}
