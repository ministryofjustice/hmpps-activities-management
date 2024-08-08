import Page from '../page'

export default class PayAmountPage extends Page {
  constructor() {
    super('pay-amount-page')
  }

  enterPayAmount = (amount: string) => this.getInputByName('rate').type(amount)

  dateOptionTomorrow = () => cy.get('#dateOption').check()
}
