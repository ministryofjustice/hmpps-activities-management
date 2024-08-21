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

  assertRow(rowNum, checkbox, activityName, location, time, scheduled, attended, notRecorded, notAttended) {
    cy.get(`[data-module=activities-sticky-select] tr`)
      .eq(rowNum)
      .find('td')
      .then($data => {
        cy.wrap($data.get(0))
          .find('input[type=checkbox]')
          .should(checkbox ? 'exist' : 'not.exist')
        expect($data.get(1).innerText).to.contain(activityName)
        expect($data.get(2).innerText).to.contain(location)
        expect($data.get(3).innerText).to.contain(time)
        expect($data.get(4).innerText).to.contain(scheduled)
        expect($data.get(5).innerText).to.contain(attended)
        expect($data.get(6).innerText).to.contain(notRecorded)
        expect($data.get(7).innerText).to.contain(notAttended)
      })
  }

  sessionPMCheckbox = () => cy.get(`[name=sessionFilters][value="PM"]`)
}
