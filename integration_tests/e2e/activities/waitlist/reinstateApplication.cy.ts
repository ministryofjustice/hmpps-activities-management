import Page from '../../../pages/page'
import getPrisonerA1350DZ from '../../../fixtures/prisonerSearchApi/getPrisoner-MDI-A1350DZ.json'
import getActivity from '../../../fixtures/activitiesApi/getActivity.json'
import WaitlistDashboardPage from '../../../pages/activities/waitlist/waitlistDashboardPage'
import ViewApplicationPage from '../../../pages/activities/waitlist/viewApplicationPage'
import ReinstatePage from '../../../pages/activities/waitlist/reinstatePage'
import ReinstateReasonPage from '../../../pages/activities/waitlist/reinstateReasonPage'

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

  it('Should be able to reinstate a withdrawn application', () => {
    const withdrawnApplication = { ...getWaitlistApplication, status: 'WITHDRAWN' }
    cy.stubEndpoint('GET', '/waiting-list-applications/1', withdrawnApplication as unknown as JSON)

    cy.visit('/activities/waitlist-dashboard')

    const waitlistDashboardPage = Page.verifyOnPage(WaitlistDashboardPage)
    waitlistDashboardPage.selectFirstApplication()
    waitlistDashboardPage.viewApplication()

    const viewApplicationPage = Page.verifyOnPage(ViewApplicationPage)
    viewApplicationPage.reinstateLink().click()

    const reinstatePage = Page.verifyOnPage(ReinstatePage)
    reinstatePage.yesRadioClick()
    reinstatePage.continueButton().click()

    const reinstateReasonPage = Page.verifyOnPage(ReinstateReasonPage)
    reinstateReasonPage.reinstateReasonTextArea().type('Example reason for reinstating the application')
    reinstateReasonPage.confirmButton().click()

    const updatedApplication = { ...getWaitlistApplication, status: 'PENDING' }
    cy.stubEndpoint('GET', '/waiting-list-applications/1', updatedApplication as unknown as JSON)

    const updatedViewApplicationPage = Page.verifyOnPage(ViewApplicationPage)
    updatedViewApplicationPage
      .successBanner()
      .should('contain.text', `You have updated the status of David Winchurch's application`)
  })

  it('Should be able to cancel reinstating a withdrawn application with No', () => {
    const withdrawnApplication = { ...getWaitlistApplication, status: 'WITHDRAWN' }
    cy.stubEndpoint('GET', '/waiting-list-applications/1', withdrawnApplication as unknown as JSON)

    cy.visit('/activities/waitlist-dashboard')

    const waitlistDashboardPage = Page.verifyOnPage(WaitlistDashboardPage)
    waitlistDashboardPage.selectFirstApplication()
    waitlistDashboardPage.viewApplication()

    const viewApplicationPage = Page.verifyOnPage(ViewApplicationPage)
    viewApplicationPage.reinstateLink().click()

    const reinstatePage = Page.verifyOnPage(ReinstatePage)
    reinstatePage.noRadioClick()
    reinstatePage.continueButton().click()

    const updatedViewApplicationPage = Page.verifyOnPage(ViewApplicationPage)
    updatedViewApplicationPage.successBanner().should('not.exist')
  })

  it('Should be able to cancel reinstating a withdrawn application with Cancel', () => {
    const withdrawnApplication = { ...getWaitlistApplication, status: 'WITHDRAWN' }
    cy.stubEndpoint('GET', '/waiting-list-applications/1', withdrawnApplication as unknown as JSON)

    cy.visit('/activities/waitlist-dashboard')

    const waitlistDashboardPage = Page.verifyOnPage(WaitlistDashboardPage)
    waitlistDashboardPage.selectFirstApplication()
    waitlistDashboardPage.viewApplication()

    const viewApplicationPage = Page.verifyOnPage(ViewApplicationPage)
    viewApplicationPage.reinstateLink().click()

    const reinstatePage = Page.verifyOnPage(ReinstatePage)
    reinstatePage.cancelLink().click()

    const updatedViewApplicationPage = Page.verifyOnPage(ViewApplicationPage)
    updatedViewApplicationPage.successBanner().should('not.exist')
  })
})
