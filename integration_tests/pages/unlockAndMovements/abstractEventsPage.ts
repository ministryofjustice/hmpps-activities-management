import Page from '../page'

export const CAT_A_BADGE = { clazz: 'cat-a-status--a', text: 'CAT A' }
export const PEEP_BADGE = { clazz: 'alert-status--disability', text: 'PEEP' }
export const CONTROLLED_UNLOCK_BADGE = { clazz: 'alert-status--controlled-unlock', text: 'Controlled Unlock' }
export default abstract class AbstractEventsPage extends Page {
  protected constructor(pageId: string) {
    super(pageId)
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

  tactAlertCheckbox = () => this.alertCheckBox('ALERT_TACT')

  catAAlertCheckbox = () => this.alertCheckBox('CAT_A')

  catAHigherAlertCheckbox = () => this.alertCheckBox('CAT_A_HIGHER')

  catAProvisionalAlertCheckbox = () => this.alertCheckBox('CAT_A_PROVISIONAL')

  alertCheckBox = (alert: string) => cy.get(`[name=alertFilters][value="${alert}"]`)

  selectAllAlerts = () => cy.get('a[data-checkbox-name="alertFilters"]')

  relevantAlertColumn = () => cy.get('th').contains('Relevant alerts')
}
