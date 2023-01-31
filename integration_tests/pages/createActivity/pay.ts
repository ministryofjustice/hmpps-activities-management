import Page from '../page'

export default class PayPage extends Page {
  constructor() {
    super('pay-page')
  }

  enterPayAmount = (amount: string) => this.getInputByName('rate').type(amount)

  selectPayBand = (payBand: string) => this.getInputByName('bandId').select(payBand)

  selectCheckboxes = (checkedInputs: string[]) => checkedInputs.forEach(input => this.getInputByLabel(input).click())

  reviewAndAddMoreRates = () => cy.get('button').contains('Review and add more rates').click()
}
