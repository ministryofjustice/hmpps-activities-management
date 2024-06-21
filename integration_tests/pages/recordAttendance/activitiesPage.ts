import Page from '../page'

export default class ActivitiesPage extends Page {
  constructor() {
    super('activities-page')
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

  assertRow(rowNum, checkbox, activityName, location, session, scheduled, attended, notRecorded, notAttended) {
    cy.get(`[data-module=activities-sticky-select] tr`)
      .eq(rowNum)
      .find('td')
      .eq(1)
      .contains(activityName)
      .parents('tr')
      .find('td')
      .eq(2)
      .contains(location)
      .parents('tr')
      .find('td')
      .eq(3)
      .contains(session)
      .parents('tr')
      .find('td')
      .eq(4)
      .contains(scheduled)
      .parents('tr')
      .find('td')
      .eq(5)
      .contains(attended)
      .parents('tr')
      .find('td')
      .eq(6)
      .contains(notRecorded)
      .parents('tr')
      .find('td')
      .eq(7)
      .contains(notAttended)
      .parents('tr')
      .find('td')
      .eq(0)
      .find('input[type=checkbox]')
      .should(checkbox ? 'exist' : 'not.exist')
  }

  sessionPMCheckbox = () => cy.get(`[name=sessionFilters][value="pm"]`)
}
