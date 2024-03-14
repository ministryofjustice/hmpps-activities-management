import Page from '../page'

export default class AllocationDashboard extends Page {
  constructor() {
    super('allocation-dashboard-page')
  }

  tabWithTitle = (title: string) => cy.get('.govuk-tabs__tab').contains(title)

  allocatedPeopleRows = (): Cypress.Chainable =>
    cy
      .get('#currently-allocated-tab')
      .find('.govuk-table__body')
      .find('tr')
      .then($el => {
        return Cypress.$.makeArray($el)
      })

  candidateRows = (): Cypress.Chainable =>
    cy
      .get('#candidates-tab')
      .find('.govuk-table__body')
      .find('tr')
      .then($el => {
        return Cypress.$.makeArray($el)
      })

  selectCandidateWithName = (name: string): void => {
    this.getInputByLabel(name).click()
    cy.get('#candidates-tab').find('button').contains('Allocate').click()
  }

  selectAllocatedPrisonerByName = (name: string): void => {
    this.getInputByLabel(name).click()
  }

  deallocateSelectedPrisoners = (): void => {
    cy.get('#currently-allocated-tab').find('button').contains('End allocation').click()
  }

  activeTimeSlots = () => cy.get('.govuk-table__cell > .govuk-tag').contains('Yes')

  selectRiskLevelOption = (option: string) => cy.get('#riskLevelFilter').select(option)

  applyFilters = () => cy.get('#apply-filters').click()
}
