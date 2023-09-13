import Page from '../../page'

export default class ExtraInformationPage extends Page {
  constructor() {
    super('appointment-extra-information-page')
  }

  enterExtraInformation = (extraInformation: string) =>
    this.getInputByName('extraInformation').clear().type(extraInformation)
}
