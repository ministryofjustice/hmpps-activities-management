import Page from '../../page'

export default class RepeatPage extends Page {
  constructor() {
    super('appointment-repeat-page')
  }

  selectRepeat = (option: string) => this.getInputByLabel(option).click()

  assertRepeat = (option: string) => cy.get(`[name='repeat']:checked`).next().should('contain.text', option)
}
