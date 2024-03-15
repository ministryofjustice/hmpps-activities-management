import Page from '../page'

export default class CheckAnswersPage extends Page {
  constructor() {
    super('check-answers-page')
  }

  createActivity = () => cy.get('button').contains('Create activity').click()

  assertActivityDetail = (header: string, value: string) =>
    this.assertSummaryListValue('activity-details', header, value)

  assertRecordAttendance = (expectedValue: string) => this.assertActivityDetail('Record attendance', expectedValue)
}
