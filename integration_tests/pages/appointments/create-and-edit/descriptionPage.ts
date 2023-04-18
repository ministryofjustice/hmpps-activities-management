import Page from '../../page'

export default class DescriptionPage extends Page {
  constructor() {
    super('appointments-create-description-page')
  }

  descriptionOption = (text: string) => this.getInputByLabel(text).click()
}
