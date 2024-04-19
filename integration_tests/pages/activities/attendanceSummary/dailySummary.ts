import Page from '../../page'

export default class DailySummaryPage extends Page {
  constructor() {
    super('daily-attendance-summary-page')
  }

  selectSessionsLink = () => cy.get('[data-qa=sessions-link]').first().invoke('attr', 'target', '_self').click()
}
