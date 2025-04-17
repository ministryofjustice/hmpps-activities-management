import Page from '../../page'

export default class CheckYourAnswersPage extends Page {
  constructor() {
    super('check-answers-page')
  }

  assertWaitlistApplicationDetail = (header: string, value: string) =>
    this.assertSummaryListValue('waitlist-application-details', header, value)

  assertApplicant = (applicant: string) => this.assertWaitlistApplicationDetail('Applicant', applicant)

  assertActivityRequested = (activity: string) => this.assertWaitlistApplicationDetail('Activity requested', activity)

  assertRequestDate = (date: string) => this.assertWaitlistApplicationDetail('Request date', date)

  assertRequester = (requester: string) => this.assertWaitlistApplicationDetail('Requester', requester)

  assertStatus = (status: string) => this.assertWaitlistApplicationDetail('Status', status)

  assertComment = (comment: string) => this.assertWaitlistApplicationDetail('Comment', comment)

  logApplication = () => cy.get('button').contains('Log activity application').click()
}
