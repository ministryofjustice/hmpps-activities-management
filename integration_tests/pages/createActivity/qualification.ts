import Page from '../page'

export default class QualificationPage extends Page {
  constructor() {
    super('qualification-page')
  }

  selectQualification = (text: string) => this.getInputByLabel(text).click()
}
