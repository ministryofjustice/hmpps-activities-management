import Page from '../../page'

export default class AttendancePage extends Page {
  constructor() {
    super('daily-attendance-detail-page')
  }

  title = () => cy.get('h1')
}
