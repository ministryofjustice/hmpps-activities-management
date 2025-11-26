import Page from '../page'

export default class CheckAllocationPage extends Page {
  constructor() {
    super('check-allocation-page')
  }

  changeEndDateLink = () => cy.get('[data-qa=change-end-date-link]').first().click()
}
