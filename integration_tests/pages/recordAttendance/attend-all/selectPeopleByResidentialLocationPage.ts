import Page from '../../page'

export default class SelectPeopleByResidentialLocationPage extends Page {
  constructor() {
    super('select-people-by-residential-location-page')
  }

  selectPrisoner = name =>
    cy
      .get('#attendanceList')
      .find('td:nth-child(2)')
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

  markAsNotRequiredOrExcused = () => cy.get('button').contains('Mark as not required or excused').click()

  cancelSessionButton = () => cy.get('a').contains('Cancel this session')

  noActivities = (activityName, session, date) =>
    cy.get('h1').contains(`${activityName} did not run in the ${session} session on ${date}`)

  selectDifferentDetails = () => cy.get('a').contains('Select a different activity, date or time period').click()

  checkSuccessBanner = (text: string) => cy.get('.govuk-notification-banner__content').contains(text)

  backLink = (): Cypress.Chainable => cy.get('.govuk-back-link')

  checkAttendanceStats = (stats: {
    totalAttendees: number
    totalAttendanceRecords: number
    totalAttended: number
    totalAbsences: number
    totalNotRecorded: number
  }) => {
    cy.get('h2').contains(`${stats.totalAttendees} people allocated to activities`)
    cy.get('p').contains('Sessions people are allocated to:').should('contain', stats.totalAttendanceRecords)
    cy.get('p').contains('Attended:').should('contain', stats.totalAttended)
    cy.get('p').contains('Absences:').should('contain', stats.totalAbsences)
    cy.get('p').contains('Not recorded:').should('contain', stats.totalNotRecorded)
  }
}
