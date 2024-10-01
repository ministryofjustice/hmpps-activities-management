import Page from '../page'

export default class AttendanceListPage extends Page {
  constructor() {
    super('attendance-list-page')
  }

  selectPrisoner = name =>
    cy
      .get('#attendanceList')
      .find('td:nth-child(3)')
      .contains(name)
      .parents('tr')
      .find('td:nth-child(1) input')
      .click({ force: true })

  checkAttendanceStatuses = (name, ...statuses: string[]) =>
    this.checkStatuses(name, 'td[data-qa="attendance"]', statuses)

  checkClashingEventsStatuses = (name, ...statuses: string[]) =>
    this.checkStatuses(name, 'td[data-qa="other-events"]', statuses)

  checkStatuses = (name: string, selector: string, statuses: string[]) =>
    cy
      .get('#attendanceList')
      .find('td[data-qa="prisoner-details"]')
      .contains(name)
      .parents('tr')
      .find(selector)
      .then($data => {
        statuses.forEach(status => {
          expect($data.text()).to.contain(status)
        })
      })

  markAsAttended = () => cy.get('button').contains('Mark as attended').click()

  markAsNotAttended = () => cy.get('button').contains('Mark as not attended').click()

  cancelSessionButton = () => cy.get('a').contains('Cancel this session')

  backLink = (): Cypress.Chainable => cy.get('.govuk-back-link')
}
