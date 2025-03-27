import Page from '../page'

export default class ConfirmMultipleAllocationsPage extends Page {
  constructor() {
    super('multiple-allocation-confirmation-page')
  }

  panelHeader = () => cy.get('h1')

  panelText = () => cy.get('.govuk-panel__body')

  activityPageLink = () => cy.get('[data-qa="activity-page-link"]')

  allocationsDashLink = () => cy.get('[data-qa="allocations-dash-link"]')
}
