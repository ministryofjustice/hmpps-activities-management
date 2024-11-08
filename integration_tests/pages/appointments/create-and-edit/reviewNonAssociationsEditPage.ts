import Page from '../../page'

export default class ReviewNonAssociationsEditPage extends Page {
  constructor() {
    super('appointment-review-non-associations-edit-page')
  }

  header = () => cy.get('h1')

  attendeeParagraph = () => cy.get('[data-qa="attendee-numbers"]')

  removeAttendeeLink = (prisonerNumber: string) => cy.get(`[data-qa=remove-attendee-link-${prisonerNumber}]`)

  cards = (number: number) => cy.get('.govuk-summary-card').should('have.length', number)

  getCard = (prisonerNumber: string) => cy.get(`[data-qa=card-${prisonerNumber}]`).find('td')

  remainingAttendees = () => cy.get('[data-qa=remaining-attendees]')

  addPrisonerButton = () => cy.get('[data-qa=add-prisoner-primary]')
}
