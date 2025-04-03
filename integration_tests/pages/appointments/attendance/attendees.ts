import Page from '../../page'

export default class AttendeesPage extends Page {
  constructor() {
    super('appointment-attendees-page')
  }

  mainCaption = (): Cypress.Chainable => cy.get('[data-qa=caption]')

  title = (): Cypress.Chainable => cy.get('.govuk-heading-l')

  timeRangeCaption = (): Cypress.Chainable => cy.get('[data-qa=time-range-caption]')

  dateCaption = (): Cypress.Chainable => cy.get('[data-qa=date-caption]')

  location = (): Cypress.Chainable => cy.get('[data-qa=location]')

  summaryAttended = (): Cypress.Chainable => cy.get('[data-qa=summary-attended]')

  summaryNotAttended = (): Cypress.Chainable => cy.get('[data-qa=summary-not-attended]')

  summaryNotRecorded = (): Cypress.Chainable => cy.get('[data-qa=summary-not-recorded]')

  viewOrEdit = (appointmentId, prisonerNumber): Cypress.Chainable =>
    cy.get(`[data-qa=view-or-edit-${appointmentId}-${prisonerNumber}]`)

  stickyTable = (): Cypress.Chainable => cy.get('[data-module=activities-sticky-select]')

  stickyTableRows = (): Cypress.Chainable => this.stickyTable().find('tbody tr')

  assertNumRows(expectedNumRows) {
    this.stickyTableRows().should('have.length', expectedNumRows)
  }

  assertNoAttendees() {
    this.stickyTableRows().contains('No attendees to display')
  }

  assertRowForMultipleAppointments(rowNum, prisonerName, cellLocation, appointmentName, attendance) {
    this.stickyTableRows()
      .eq(rowNum)
      .find('td')
      .then($data => {
        expect($data.get(1).innerText).to.contain(prisonerName)
        expect($data.get(2).innerText).to.contain(cellLocation)
        expect($data.get(3).innerText).to.contain(appointmentName)
        expect($data.get(5).innerText).to.contain(attendance)
      })
  }

  assertRowForSingleAppointments(rowNum, prisonerName, cellLocation, attendance) {
    this.stickyTableRows()
      .eq(rowNum)
      .find('td')
      .then($data => {
        expect($data.get(1).innerText).to.contain(prisonerName)
        expect($data.get(2).innerText).to.contain(cellLocation)
        expect($data.get(4).innerText).to.contain(attendance)
      })
  }

  attendeeRows = (): Cypress.Chainable =>
    this.stickyTableRows()
      .get('.govuk-table__body')
      .find('tr')
      .then($el => {
        return Cypress.$.makeArray($el)
      })

  selectAttendees = (...prisonerNames: string[]) =>
    prisonerNames.forEach(prisonerName => {
      this.attendeeRows()
        .find(`a:contains(${prisonerName})`)
        .then(e => {
          cy.wrap(e).parents('tr').find('input[type=checkbox]').click({ force: true })
        })
    })

  notificationHeading = (): Cypress.Chainable => cy.get('.govuk-notification-banner__content h3')

  notificationBody = (): Cypress.Chainable => cy.get('.govuk-notification-banner__content p')
}
