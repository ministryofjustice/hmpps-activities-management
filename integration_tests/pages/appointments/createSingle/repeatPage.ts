import Page from '../../page'

export default class RepeatPage extends Page {
  constructor() {
    super('appointments-create-single-repeat-page')
  }

  selectRepeat = (option: string) => this.getInputByLabel(option).click()

  assertRepeat = (option: string) => this.getInputByName('repeat').should('have.value', option)
}
