import Page from '../../page'

export default class AttendancePage extends Page {
  constructor() {
    super('daily-attendance-detail-page')
  }

  title = () => cy.get('h1')

  count = () => cy.get('h2')

  clearAbsenceReasons = () => cy.get('[data-qa="absenceReasonClear"]').click()

  absenceRadios = () => cy.get('[data-qa="absence-reasons-radio-buttons"]')

  payRadios = () => cy.get('[data-qa="pay-radio-buttons"]')

  categoriesRadios = () => cy.get('[data-qa="category-radio-buttons"]')
}
