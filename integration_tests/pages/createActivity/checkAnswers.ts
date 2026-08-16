import Page from '../page'

export default class CheckAnswersPage extends Page {
  constructor() {
    super('check-answers-page')
  }

  createActivity = () => cy.get('button').contains('Create activity').click()

  assertActivityDetail = (header: string, value: string) =>
    this.assertSummaryListValue('activity-details', header, value)

  changeActivityCategoryLink = () =>
    cy.contains('[data-qa="activity-details"] dt', 'Activity category').siblings('dd').find('a')

  assertRecordAttendance = (expectedValue: string) => this.assertActivityDetail('Record attendance', expectedValue)
}
