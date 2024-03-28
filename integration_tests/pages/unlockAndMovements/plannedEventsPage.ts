import Page from '../page'

export default class PlannedEventsPage extends Page {
  constructor() {
    super('planned-events-page')
  }

  assertBadges(row, ...expectedBadges) {
    cy.get('.alerts-list')
      .eq(row)
      .find('li')
      .should('have.length', expectedBadges.length)
      .each((item, index) => {
        cy.wrap(item)
          .should('contain.text', expectedBadges[index].text)
          .should('have.class', `${expectedBadges[index].clazz}`)
      })
  }

  acctAlertCheckbox = () => this.alertCheckBox('ALERT_HA')

  controlledUnlockAlertCheckbox = () => this.alertCheckBox('ALERT_XCU')

  eListAlertCheckbox = () => this.alertCheckBox('ALERT_XEL')

  peepAlertCheckbox = () => this.alertCheckBox('ALERT_PEEP')

  catAAlertCheckbox = () => this.alertCheckBox('CAT_A')

  catAHigherAlertCheckbox = () => this.alertCheckBox('CAT_A_HIGHER')

  catAProvisionalAlertCheckbox = () => this.alertCheckBox('CAT_A_PROVISIONAL')

  alertCheckBox = (alert: string) => cy.get(`[name=alertFilters][value="${alert}"]`)

  selectAllAlerts = () => cy.get('a[data-checkbox-name="alertFilters"]')

  relevantAlertColumn = () => cy.get('th').contains('Relevant alerts')
}
