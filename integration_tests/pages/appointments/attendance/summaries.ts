import Page from '../../page'

export default class SummariesPage extends Page {
  constructor() {
    super('appointment-attendance-summaries-page')
  }

  mainCaption = (): Cypress.Chainable => cy.get('[data-qa=caption]')

  title = (): Cypress.Chainable => cy.get('.govuk-heading-l')

  dateCaption = (): Cypress.Chainable => cy.get('[data-qa=date-caption]')

  summaryAttended = (): Cypress.Chainable => cy.get('[data-qa=summary-attended]')

  showingCaption = (): Cypress.Chainable => cy.get('.govuk-heading-s')

  summaryAbsent = (): Cypress.Chainable => cy.get('[data-qa=summary-absent]')

  summaryNotRecorded = (): Cypress.Chainable => cy.get('[data-qa=summary-not-recorded]')

  locationRadios = () => cy.get('[data-qa="location-radio-buttons"]')

  selectLocation = (location: string) => this.getInputById('locationId').clear().type(location)

  stickyTable = (): Cypress.Chainable => cy.get('[data-module=activities-sticky-select]')

  stickyTableRows = (): Cypress.Chainable => this.stickyTable().find('tbody tr')

  assertNumRows(expectedNumRows) {
    this.stickyTableRows().should('have.length', expectedNumRows)
  }

  assertRow(rowNum, appointmentName, location, time, attendees, attended, absent, notAttended) {
    this.stickyTableRows()
      .eq(rowNum)
      .find('td')
      .then($data => {
        expect($data.get(1).innerText).to.contain(appointmentName)
        expect($data.get(2).innerText).to.contain(location)
        expect($data.get(3).innerText).to.contain(time)
        expect($data.get(4).innerText).to.contain(attendees)
        expect($data.get(5).innerText).to.contain(attended)
        expect($data.get(6).innerText).to.contain(absent)
        expect($data.get(7).innerText).to.contain(notAttended)
      })
  }

  appointmentRows = (): Cypress.Chainable =>
    this.stickyTableRows()
      .get('.govuk-table__body')
      .find('tr')
      .then($el => {
        return Cypress.$.makeArray($el)
      })

  selectAppointmentsWithNames = (...appointmentNames: string[]) =>
    appointmentNames.forEach(appointmentName => {
      this.appointmentRows()
        .find(`a:contains(${appointmentName})`)
        .then(e => {
          cy.wrap(e).parents('tr').find('input[type=checkbox]').click({ force: true })
        })
    })
}
