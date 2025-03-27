import Page from '../page'

export default class PayBandMultiplePage extends Page {
  constructor() {
    super('pay-band-multiple-page')
  }

  selectPayBand = (text: string) => this.getInputById(text).click()

  clickDetails = () => cy.get('.govuk-details').click()

  checkTableCell = (cellNumber, contents) => {
    cy.get('[data-qa="automatic-pay-rate-details-table"]')
      .find('td')
      .then($data => expect($data.get(cellNumber).innerText).to.contain(contents))
  }
}
