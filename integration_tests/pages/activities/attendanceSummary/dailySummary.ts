import Page from '../../page'

export default class DailySummaryPage extends Page {
  constructor() {
    super('daily-attendance-summary-page')
  }

  selectSessionsLink = () => cy.get('[data-qa=sessions-link]').first().invoke('attr', 'target', '_self').click()

  tier1AttendanceStat = () => cy.get('[data-qa=tier1]').children('span')

  absencesLink = () => cy.get('[data-qa=absences-link]').first().click()

  notAttendedLink = () => cy.get('[data-qa=not-attended-link]').first().click()

  tier2AttendanceStat = () => cy.get('[data-qa=tier2]').children('span')

  refusedStat = () => cy.get('[data-qa=refused]').children('span')

  refusedLink = () => cy.get('[data-qa=refused-link]').first()

  selectTier1AttendanceLink = () => cy.get('[data-qa=tier1-link]').first().click()

  selectTier2AttendanceLink = () => cy.get('[data-qa=tier2-link]').first().click()

  selectRoutineAttendanceLink = () => cy.get('[data-qa=routine-link]').first().click()

  routineAttendanceStat = () => cy.get('[data-qa=routine]').children('span')
}
