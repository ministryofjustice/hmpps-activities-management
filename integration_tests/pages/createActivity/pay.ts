import Page from '../page'

export default class PayPage extends Page {
  constructor() {
    super('pay-page')
  }

  enterPayAmount = (amount: string) => this.getInputByName('rate').type(amount)

  selectPayBand = (payBand: string) => this.getInputByName('bandId').select(payBand)

  incentiveLevel = (text: string) => this.getInputByLabel(text).click()

  reviewAndAddMoreRates = () => cy.get('button').contains('Save and continue').click()

  radios = () => cy.get('[data-qa="incentiveLevelRadios"]')
}
