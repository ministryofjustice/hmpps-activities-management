import Page from '../../../pages/page'
import getPrisonerA1350DZ from '../../../fixtures/prisonerSearchApi/getPrisoner-MDI-A1350DZ.json'
import getActivity from '../../../fixtures/activitiesApi/getActivity.json'
import EditStatusPage from '../../../pages/activities/waitlist/editStatusPage'
import WaitlistDashboardPage from '../../../pages/activities/waitlist/waitlistDashboardPage'
import ViewApplicationPage from '../../../pages/activities/waitlist/viewApplicationPage'

const getMathsActivity = { ...getActivity }
getMathsActivity.id = 1
getMathsActivity.activityName = 'Maths level 1'
getMathsActivity.schedules[0].id = 2
getMathsActivity.schedules[0].startDate = '2025-06-23'

const getWaitlistApplication = {
  id: 1,
  activityId: 1,
  scheduleId: 2,
  allocationId: null,
  prisonerNumber: 'A1350DZ',
  status: 'PENDING',
  requestedDate: '2025-06-20',
  requestedBy: 'PRISONER',
  earliestReleaseDate: { releaseDate: '2023-12-25' },
  isIndeterminateSentence: true,
  activity: getMathsActivity,
}

const waitlistSearchResponse = {
  content: [getWaitlistApplication],
  totalPages: 1,
  number: 0,
  totalElements: 1,
  first: true,
  last: true,
}

const navigateToEditStatusPage = () => {
  cy.visit('/activities/waitlist-dashboard')

  const waitlistDashboardPage = Page.verifyOnPage(WaitlistDashboardPage)
  waitlistDashboardPage.selectFirstApplication()
  waitlistDashboardPage.viewApplication()

  const viewApplicationPage = Page.verifyOnPage(ViewApplicationPage)
  viewApplicationPage.changeStatusLink().click()

  return Page.verifyOnPage(EditStatusPage)
}

context('Waitlist - Edit Status', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()

    cy.stubEndpoint(
      'POST',
      '/waiting-list-applications/MDI/search\\?page=0&pageSize=20',
      waitlistSearchResponse as unknown as JSON,
    )
    cy.stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=false', [getMathsActivity] as unknown as JSON)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', [getPrisonerA1350DZ] as unknown as JSON)

    cy.stubEndpoint('GET', '/prisoner/A1350DZ', getPrisonerA1350DZ as unknown as JSON)
    cy.stubEndpoint('GET', '/activities/1', getActivity as unknown as JSON)
    cy.stubEndpoint('GET', '/waiting-list-applications/1', getWaitlistApplication as unknown as JSON)
    cy.stubEndpoint('PATCH', '/waiting-list-applications/1', getWaitlistApplication as unknown as JSON)
    cy.stubEndpoint('GET', '/waiting-list-applications/1/history', [] as unknown as JSON)
    cy.stubEndpoint('GET', '/schedules/2/waiting-list-applications\\?includeNonAssociationsCheck=false', [])
    cy.stubEndpoint('GET', '/activities/1/filtered', getActivity as unknown as JSON)
  })

  it('Should navigate from dashboard to edit status and change PENDING status', () => {
    cy.visit('/activities/waitlist-dashboard')

    const waitlistDashboardPage = Page.verifyOnPage(WaitlistDashboardPage)

    waitlistDashboardPage.checkPrisonerDetails('Winchurch, David Bob')
    waitlistDashboardPage.checkActivityName('Maths level 1')
    waitlistDashboardPage.checkRequestData('20 June 2025')
    waitlistDashboardPage.checkRequestData('Self-requested')
    waitlistDashboardPage.checkEarliestReleaseDate('25 December 2023')

    waitlistDashboardPage.checkApplicationStatus('Pending')

    waitlistDashboardPage.selectFirstApplication()
    waitlistDashboardPage.viewApplication()

    const viewApplicationPage = Page.verifyOnPage(ViewApplicationPage)
    viewApplicationPage.checkApplicationStatus('Pending')
    viewApplicationPage.checkActivityRequested('A basic english course suitable for introduction to the subject')
    viewApplicationPage.checkRequester('Self-requested')
    viewApplicationPage.checkDateOfRequest('20th June 2025')
    viewApplicationPage.checkComments('None')

    viewApplicationPage.changeStatusLink().click()

    const editStatusPage = Page.verifyOnPage(EditStatusPage)
    editStatusPage.checkCurrentStatus('Pending')
    editStatusPage.checkHintText(
      'You can approve this application, reject it, or withdraw it to remove David Winchurch from the waitlist',
    )
    editStatusPage.pendingRadioButton().should('not.exist')
    editStatusPage.approvedRadioButton().should('exist')
    editStatusPage.rejectedRadioButton().should('exist')
    editStatusPage.withdrawnRadioButton().should('exist')

    editStatusPage.approvedRadioButton().click()
    editStatusPage.updateButton().click()

    Page.verifyOnPage(ViewApplicationPage)
    viewApplicationPage.successBanner().should('be.visible')
    viewApplicationPage
      .successBanner()
      .should('contain.text', "You have updated the status of David Winchurch's application")
  })

  it('Should display correct hint text and buttons for APPROVED status', () => {
    const approvedApplication = { ...getWaitlistApplication, status: 'APPROVED' }
    cy.stubEndpoint('GET', '/waiting-list-applications/1', approvedApplication as unknown as JSON)

    const editStatusPage = navigateToEditStatusPage()
    editStatusPage.checkCurrentStatus('Approved')
    editStatusPage.checkHintText(
      'You can change the status to pending if more checks are needed, reject it, or withdraw it to remove David Winchurch from the waitlist.',
    )
    editStatusPage.approvedRadioButton().should('not.exist')
    editStatusPage.pendingRadioButton().should('exist')
    editStatusPage.rejectedRadioButton().should('exist')
    editStatusPage.withdrawnRadioButton().should('exist')
  })

  it('Should display correct hint text and buttons for REJECTED status', () => {
    const rejectedApplication = { ...getWaitlistApplication, status: 'DECLINED' }
    cy.stubEndpoint('GET', '/waiting-list-applications/1', rejectedApplication as unknown as JSON)

    const editStatusPage = navigateToEditStatusPage()
    editStatusPage.checkCurrentStatus('Rejected')
    editStatusPage.checkHintText(
      'You can approve this application, change it to pending if more checks are needed,' +
        ' or withdraw it to remove David Winchurch from the waitlist.',
    )
    editStatusPage.rejectedRadioButton().should('not.exist')
    editStatusPage.approvedRadioButton().should('exist')
    editStatusPage.pendingRadioButton().should('exist')
    editStatusPage.withdrawnRadioButton().should('exist')
  })

  // TODO: Test for WITHDRAWN status as part of SAA-3663
})
