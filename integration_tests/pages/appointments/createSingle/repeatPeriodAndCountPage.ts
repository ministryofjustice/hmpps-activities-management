import Page from '../../page'

export default class RepeatPeriodAndCountPage extends Page {
  constructor() {
    super('appointments-create-repeat-period-and-count-page')
  }

  selectRepeatPeriod = (option: string) => this.getInputByLabel(option).click()

  assertRepeatPeriod = (option: string) => cy.get(`[name='repeatPeriod']:checked`).next().should('contain.text', option)

  enterRepeatCount = (count: string) => this.getInputByName('repeatCount').clear().type(count)

  assertRepeatCount = (count: string) => this.getInputByName('repeatCount').should('have.value', count)
}
