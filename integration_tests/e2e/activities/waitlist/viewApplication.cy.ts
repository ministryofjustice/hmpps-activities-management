import Page from '../../../pages/page'
import getPrisonerA1350DZ from '../../../fixtures/prisonerSearchApi/getPrisoner-MDI-A1350DZ.json'
import getActivity from '../../../fixtures/activitiesApi/getActivity.json'
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
  statusUpdatedTime: '2025-06-20T14:22:00',
}

const waitlistSearchResponse = {
  content: [getWaitlistApplication],
  totalPages: 1,
  number: 0,
  totalElements: 1,
  first: true,
  last: true,
}

context('Waitlist - Edit Status', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()

    cy.stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=false', [getMathsActivity] as unknown as JSON)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', [getPrisonerA1350DZ] as unknown as JSON)

    cy.stubEndpoint('GET', '/prisoner/A1350DZ', getPrisonerA1350DZ as unknown as JSON)
    cy.stubEndpoint('GET', '/activities/1', getActivity as unknown as JSON)

    cy.stubEndpoint('GET', '/waiting-list-applications/1/history', [] as unknown as JSON)
    cy.stubEndpoint('GET', '/schedules/2/waiting-list-applications\\?includeNonAssociationsCheck=false', [])
    cy.stubEndpoint('GET', '/activities/1/filtered', getActivity as unknown as JSON)
  })

  it('Should be able to view a pending application', () => {
    cy.stubEndpoint('GET', '/waiting-list-applications/1', getWaitlistApplication as unknown as JSON)
    cy.stubEndpoint(
      'POST',
      '/waiting-list-applications/MDI/search\\?page=0&pageSize=20',
      waitlistSearchResponse as unknown as JSON,
    )
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
    viewApplicationPage.checkLastChangedData('Last changed 20th June 2025 14:22')
    viewApplicationPage.checkActivityRequested('A basic english course suitable for introduction to the subject')
    viewApplicationPage.checkRequester('Self-requested')
    viewApplicationPage.checkDateOfRequest('20th June 2025')
    viewApplicationPage.checkComments('None')

    viewApplicationPage.selectApplicationHistoryTab()

    viewApplicationPage.checkApplicationHistory('Application Logged')
  })

  it('Should be able to view an approved application', () => {
    const approvedApplication = { ...getWaitlistApplication, status: 'APPROVED' }
    cy.stubEndpoint('GET', '/waiting-list-applications/1', approvedApplication as unknown as JSON)
    cy.stubEndpoint('POST', '/waiting-list-applications/MDI/search\\?page=0&pageSize=20', {
      ...waitlistSearchResponse,
      content: [approvedApplication],
    } as unknown as JSON)
    cy.visit('/activities/waitlist-dashboard')

    const waitlistDashboardPage = Page.verifyOnPage(WaitlistDashboardPage)

    waitlistDashboardPage.checkPrisonerDetails('Winchurch, David Bob')
    waitlistDashboardPage.checkActivityName('Maths level 1')
    waitlistDashboardPage.checkRequestData('20 June 2025')
    waitlistDashboardPage.checkRequestData('Self-requested')
    waitlistDashboardPage.checkEarliestReleaseDate('25 December 2023')

    waitlistDashboardPage.checkApplicationStatus('Approved')

    waitlistDashboardPage.selectFirstApplication()
    waitlistDashboardPage.viewApplication()

    const viewApplicationPage = Page.verifyOnPage(ViewApplicationPage)
    viewApplicationPage.checkApplicationStatus('Approved')
    viewApplicationPage.checkActivityRequested('A basic english course suitable for introduction to the subject')
    viewApplicationPage.checkRequester('Self-requested')
    viewApplicationPage.checkDateOfRequest('20th June 2025')
    viewApplicationPage.checkComments('None')
  })

  it('Should be able to view a rejected application', () => {
    const rejectedApplication = { ...getWaitlistApplication, status: 'DECLINED' }
    cy.stubEndpoint('GET', '/waiting-list-applications/1', rejectedApplication as unknown as JSON)
    cy.stubEndpoint('POST', '/waiting-list-applications/MDI/search\\?page=0&pageSize=20', {
      ...waitlistSearchResponse,
      content: [rejectedApplication],
    } as unknown as JSON)
    cy.visit('/activities/waitlist-dashboard')

    const waitlistDashboardPage = Page.verifyOnPage(WaitlistDashboardPage)

    waitlistDashboardPage.checkPrisonerDetails('Winchurch, David Bob')
    waitlistDashboardPage.checkActivityName('Maths level 1')
    waitlistDashboardPage.checkRequestData('20 June 2025')
    waitlistDashboardPage.checkRequestData('Self-requested')
    waitlistDashboardPage.checkEarliestReleaseDate('25 December 2023')

    waitlistDashboardPage.checkApplicationStatus('Rejected')

    waitlistDashboardPage.selectFirstApplication()
    waitlistDashboardPage.viewApplication()

    const viewApplicationPage = Page.verifyOnPage(ViewApplicationPage)
    viewApplicationPage.checkApplicationStatus('Rejected')
    viewApplicationPage.checkActivityRequested('A basic english course suitable for introduction to the subject')
    viewApplicationPage.checkRequester('Self-requested')
    viewApplicationPage.checkDateOfRequest('20th June 2025')
    viewApplicationPage.checkComments('None')
  })

  it('Should be able to view a withdrawn application', () => {
    const withdrawnApplication = { ...getWaitlistApplication, status: 'WITHDRAWN' }
    cy.stubEndpoint('GET', '/waiting-list-applications/1', withdrawnApplication as unknown as JSON)
    cy.stubEndpoint('POST', '/waiting-list-applications/MDI/search\\?page=0&pageSize=20', {
      ...waitlistSearchResponse,
      content: [withdrawnApplication],
    } as unknown as JSON)
    cy.visit('/activities/waitlist-dashboard')

    const waitlistDashboardPage = Page.verifyOnPage(WaitlistDashboardPage)

    waitlistDashboardPage.checkPrisonerDetails('Winchurch, David Bob')
    waitlistDashboardPage.checkActivityName('Maths level 1')
    waitlistDashboardPage.checkRequestData('20 June 2025')
    waitlistDashboardPage.checkRequestData('Self-requested')
    waitlistDashboardPage.checkEarliestReleaseDate('25 December 2023')

    waitlistDashboardPage.checkApplicationStatus('Withdrawn')

    waitlistDashboardPage.selectFirstApplication()
    waitlistDashboardPage.viewApplication()

    const viewApplicationPage = Page.verifyOnPage(ViewApplicationPage)
    viewApplicationPage.checkApplicationStatus('Withdrawn')
    viewApplicationPage.checkActivityRequested('A basic english course suitable for introduction to the subject')
    viewApplicationPage.checkRequester('Self-requested')
    viewApplicationPage.checkDateOfRequest('20th June 2025')
    viewApplicationPage.checkComments('None')
  })
})
