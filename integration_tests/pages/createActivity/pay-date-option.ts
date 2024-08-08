import Page from '../page'

export default class PayDateOptionPage extends Page {
  constructor() {
    super('pay-date-option-page')
  }

  dateOptionOther = () => cy.get('#dateOption-2').check()
}
