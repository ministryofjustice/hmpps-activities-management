import { addDays, formatDate, subDays } from 'date-fns'
import Page from '../../../pages/page'
import getPrisonerA1350DZ from '../../../fixtures/prisonerSearchApi/getPrisoner-MDI-A1350DZ.json'
import RequestDatePage from '../../../pages/activities/waitlist/requestDatePage'
import getActivities from '../../../fixtures/activitiesApi/getActivities.json'
import WaitlistSearchForActivityPage from '../../../pages/activities/waitlist/searchForActivityPage'
import getActivity from '../../../fixtures/activitiesApi/getActivity.json'
import RequesterPage from '../../../pages/activities/waitlist/requesterPage'
import { formatIsoDate } from '../../../../server/utils/datePickerUtils'
import StatusPage from '../../../pages/activities/waitlist/statusPage'
import CheckYourAnswersPage from '../../../pages/activities/waitlist/checkAnswersPage'
import ConfirmationPage from '../../../pages/activities/waitlist/confirmation'

const getActivity1 = { ...getActivity }
getActivity1.id = 1
getActivity1.summary = 'Maths level 1'
getActivity1.description = 'Maths level 1'
getActivity1.schedules[0].startDate = formatIsoDate(subDays(new Date(), 1))

context('Waitlist', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
    cy.stubEndpoint('GET', '/prisoner/A1350DZ', getPrisonerA1350DZ as unknown as JSON)
    cy.stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=true', getActivities)
    cy.stubEndpoint('GET', '/activities/1/filtered', getActivity1 as unknown as JSON)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', [])
    cy.stubEndpoint('GET', '/schedules/2/waiting-list-applications\\?includeNonAssociationsCheck=false', [])
    cy.stubEndpoint('POST', '/allocations/MDI/waiting-list-application', [])
  })

  it('Should be able log a pending activity application, by prisoner', () => {
    cy.visit('/activities/waitlist/2f0b204c-2d68-4c53-b581-b4d0075dd231/A1350DZ/apply')
    const yesterday = subDays(new Date(), 1)
    const requestDatePage = Page.verifyOnPage(RequestDatePage)
    requestDatePage.selectDatePickerDate(yesterday)
    requestDatePage.continue()

    const searchForActivityPage = Page.verifyOnPage(WaitlistSearchForActivityPage)
    searchForActivityPage.searchBox().type('Maths level 1')
    searchForActivityPage.continue()

    const requesterPage = Page.verifyOnPage(RequesterPage)
    requesterPage.prisonerRadioClick()
    requesterPage.continue()

    const statusPage = Page.verifyOnPage(StatusPage)
    statusPage.pendingRadioClick()
    statusPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckYourAnswersPage)
    checkAnswersPage.assertApplicant('A1350DZ')
    checkAnswersPage.assertActivityRequested('Maths level 1')
    checkAnswersPage.assertRequestDate(formatDate(yesterday, 'do MMMM yyyy'))
    checkAnswersPage.assertRequester('Self-requested')
    checkAnswersPage.assertStatus('Pending')
    checkAnswersPage.assertComment('None')
    checkAnswersPage.logApplication()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage
      .panelHeader()
      .contains(`${getPrisonerA1350DZ.firstName} ${getPrisonerA1350DZ.lastName}`, { matchCase: false })
    confirmationPage.panelHeader().should('contain', getActivity1.summary)
    confirmationPage.panelText().should('contain', 'Pending')
  })

  it('Should be able log an approved activity application, by staff', () => {
    cy.visit('/activities/waitlist/2f0b204c-2d68-4c53-b581-b4d0075dd231/A1350DZ/apply')
    const yesterday = subDays(new Date(), 1)
    const requestDatePage = Page.verifyOnPage(RequestDatePage)
    requestDatePage.selectDatePickerDate(yesterday)
    requestDatePage.continue()

    const searchForActivityPage = Page.verifyOnPage(WaitlistSearchForActivityPage)
    searchForActivityPage.searchBox().type('Maths level 1')
    searchForActivityPage.continue()

    const requesterPage = Page.verifyOnPage(RequesterPage)
    requesterPage.guidanceStaffRadioClick()
    requesterPage.continue()

    const statusPage = Page.verifyOnPage(StatusPage)
    statusPage.approvedRadioClick()
    statusPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckYourAnswersPage)
    checkAnswersPage.assertApplicant('A1350DZ')
    checkAnswersPage.assertActivityRequested('Maths level 1')
    checkAnswersPage.assertRequestDate(formatDate(yesterday, 'do MMMM yyyy'))
    checkAnswersPage.assertRequester('IAG or careers information, advice and guidance staff')
    checkAnswersPage.assertStatus('Approved')
    checkAnswersPage.assertComment('None')
    checkAnswersPage.logApplication()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage
      .panelHeader()
      .contains(`${getPrisonerA1350DZ.firstName} ${getPrisonerA1350DZ.lastName}`, { matchCase: false })
    confirmationPage.panelHeader().should('contain', getActivity1.summary)
    confirmationPage.panelText().should('contain', 'Approved')
  })

  it('Should be able log a rejected activity application, by other', () => {
    cy.visit('/activities/waitlist/2f0b204c-2d68-4c53-b581-b4d0075dd231/A1350DZ/apply')
    const yesterday = subDays(new Date(), 1)
    const requestDatePage = Page.verifyOnPage(RequestDatePage)
    requestDatePage.selectDatePickerDate(yesterday)
    requestDatePage.continue()

    const searchForActivityPage = Page.verifyOnPage(WaitlistSearchForActivityPage)
    searchForActivityPage.searchBox().type('Maths level 1')
    searchForActivityPage.continue()

    const requesterPage = Page.verifyOnPage(RequesterPage)
    requesterPage.someoneElseRadioClick()
    requesterPage.someoneElseSelect().select('Education staff')
    requesterPage.continue()

    const statusPage = Page.verifyOnPage(StatusPage)
    statusPage.rejectedRadioClick()
    statusPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckYourAnswersPage)
    checkAnswersPage.assertApplicant('A1350DZ')
    checkAnswersPage.assertActivityRequested('Maths level 1')
    checkAnswersPage.assertRequestDate(formatDate(yesterday, 'do MMMM yyyy'))
    checkAnswersPage.assertRequester('Education staff')
    checkAnswersPage.assertStatus('Rejected')
    checkAnswersPage.assertComment('None')
    checkAnswersPage.logApplication()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage
      .panelHeader()
      .contains(`${getPrisonerA1350DZ.firstName} ${getPrisonerA1350DZ.lastName}`, { matchCase: false })
    confirmationPage.panelHeader().should('contain', getActivity1.summary)
    confirmationPage.panelText().should('contain', 'Declined')
  })

  it('Shouldnt be able to select a date in the future', () => {
    cy.visit('/activities/waitlist/2f0b204c-2d68-4c53-b581-b4d0075dd231/A1350DZ/apply')
    const tomorrow = addDays(new Date(), 1)
    const requestDatePage = Page.verifyOnPage(RequestDatePage)
    requestDatePage.selectDatePickerDate(tomorrow)
    requestDatePage.continue()

    requestDatePage.assertValidationError('requestDate', 'The request date cannot be in the future')
  })

  it('Should warn the user if prisoner is already allocated', () => {
    cy.visit('/activities/waitlist/2f0b204c-2d68-4c53-b581-b4d0075dd231/A1350DZ/apply')
    const yesterday = subDays(new Date(), 1)
    const requestDatePage = Page.verifyOnPage(RequestDatePage)
    requestDatePage.selectDatePickerDate(yesterday)
    requestDatePage.continue()

    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', [{ allocations: [{ scheduleId: 1 }] }])
    cy.stubEndpoint('GET', '/schedules/2/waiting-list-applications\\?includeNonAssociationsCheck=false', [
      {
        prisonerNumber: 'A1350DZ',
        scheduleId: 1,
        status: 'PENDING',
      },
    ])

    const searchForActivityPage = Page.verifyOnPage(WaitlistSearchForActivityPage)
    searchForActivityPage.searchBox().type('Maths level 1')
    searchForActivityPage.continue()

    searchForActivityPage.assertValidationError('activityId', 'is already allocated or on the waitlist for')
  })
})
