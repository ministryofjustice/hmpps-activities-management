import Page from '../../../page'

export default class VideoLinkSchedulePage extends Page {
  constructor() {
    super('appointment-schedule-page')
  }

  assertPrisonerProfileLink = (prisonerNumber: string) => {
    cy.get('[data-qa="prisoner-profile-link"]').should(
      'have.attr',
      'href',
      `https://digital-dev.prison.service.justice.gov.uk/prisoner/${prisonerNumber}`,
    )
  }

  assertCellLocation = (location: string) => {
    cy.get('[data-qa="prisoner-cell-location"]').should('contain.text', location)
  }

  // Other checks can go here when required
}
