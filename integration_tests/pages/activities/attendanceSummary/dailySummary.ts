import Page from '../../page'

export default class DailySummaryPage extends Page {
  constructor() {
    super('daily-attendance-summary-page')
  }

  selectSessionsLink = () => cy.get('[data-qa=sessions-link]').first().invoke('attr', 'target', '_self').click()

  tier1AttendanceStat = () => cy.get('[data-qa=tier1]').children('span')

  tier2AttendanceStat = () => cy.get('[data-qa=tier2]').children('span')

  selectTier1AttendanceLink = () => cy.get('[data-qa=tier1-link]').first().click()

  selectTier2AttendanceLink = () => cy.get('[data-qa=tier2-link]').first().click()

  selectRoutineAttendanceLink = () => cy.get('[data-qa=routine-link]').first().click()

  routineAttendanceStat = () => cy.get('[data-qa=routine]').children('span')
}
