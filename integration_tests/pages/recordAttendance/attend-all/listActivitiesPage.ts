import Page from '../../page'

export default class ListActivitiesPage extends Page {
  constructor() {
    super('list-activities-page')
  }

  activityRows = (): Cypress.Chainable =>
    cy
      .get('.govuk-table__body')
      .find('tr')
      .then($el => {
        return Cypress.$.makeArray($el)
      })

  selectActivityWithName = (activityName: string) =>
    this.activityRows()
      .find(`a:contains(${activityName})`)
      .then(e => {
        const activityUrl = e.prop('href')
        cy.visit(activityUrl)
      })

  containsActivities = (...activities: string[]) => {
    this.activityRows()
      .find('a')
      .should('have.length', activities.length)
      .each((item, index) => {
        cy.wrap(item).should('contain', activities[index])
      })
  }

  selectActivitiesWithNames = (...activityNames: string[]) =>
    activityNames.forEach(activityName => {
      this.activityRows()
        .find(`a:contains(${activityName})`)
        .then(e => {
          cy.wrap(e).parents('tr').find('input[type=checkbox]').click({ force: true })
        })
    })
}
