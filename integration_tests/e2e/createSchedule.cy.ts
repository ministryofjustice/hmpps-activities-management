import Page from '../pages/page'
import ScheduleNamePage from '../pages/createSchedule/name'

context('Create schedule', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')
    cy.signIn()

    // To be removed when there is an entry point for this journey
    cy.request('/schedule/activities/2/create-schedule/start')
  })

  it('should click through create schedule journey', () => {
    const activityNamePage = Page.verifyOnPage(ScheduleNamePage)
    activityNamePage.enterName('Entry level English 1')
    activityNamePage.continue()
  })
})
