import { addDays } from 'date-fns/addDays'
import { format } from 'date-fns/format'
import getInmateDetails from '../../../fixtures/prisonerSearchApi/getPrisoner-MDI-A5015DY.json'
import { Activity } from '../../../../server/@types/activitiesAPI/types'
import ViewAllocationsPage from '../../../pages/activities/suspensions/viewAllocations'
import Page from '../../../pages/page'
import { toDateString } from '../../../../server/utils/utils'
import SuspendFromPage from '../../../pages/activities/suspensions/suspendFrom'
import SuspensionPayPage from '../../../pages/activities/suspensions/pay'
import CaseNoteQuestionPage from '../../../pages/activities/suspensions/caseNoteQuestion'
import CheckAnswersPage from '../../../pages/activities/suspensions/checkAnswers'
import ConfirmationPage from '../../../pages/activities/suspensions/confirmation'

const activityInsidePaid = {
  id: 12,
  paid: true,
  outsideWork: false,
  pay: [
    {
      prisonPayBand: { id: 314 },
      incentiveLevel: 'Standard',
      startDate: null,
      rate: 100,
    },
  ],
} as unknown as Activity

const activityOutsidePaid = {
  id: 14,
  paid: true,
  outsideWork: true,
  pay: [
    {
      prisonPayBand: { id: 314 },
      incentiveLevel: 'Standard',
      startDate: null,
      rate: 100,
    },
  ],
} as unknown as Activity

const getPrisonerAllocations = [
  {
    prisonerNumber: 'G0995GW',
    allocations: [
      {
        id: 2,
        prisonerNumber: 'G0995GW',
        bookingId: 1058066,
        activitySummary: 'Active activity',
        activityId: 12,
        scheduleId: 345,
        prisonPayBand: {
          id: 314,
          displaySequence: 3,
          alias: 'Pay band 3',
          description: 'Pay band 3',
          nomisPayBand: 3,
          prisonCode: 'RSI',
          createdTime: null,
          createdBy: null,
          updatedTime: null,
          updatedBy: null,
        },
        startDate: '2024-12-09',
        endDate: null,
        status: 'ACTIVE',
        plannedSuspension: null,
      },
      {
        id: 4,
        prisonerNumber: 'G0995GW',
        bookingId: 1058066,
        activitySummary: 'Hotel',
        activityId: 14,
        scheduleId: 345,
        prisonPayBand: {
          id: 314,
          displaySequence: 3,
          alias: 'Pay band 3',
          description: 'Pay band 3',
          nomisPayBand: 3,
          prisonCode: 'RSI',
          createdTime: null,
          createdBy: null,
          updatedTime: null,
          updatedBy: null,
        },
        startDate: '2024-12-09',
        endDate: null,
        status: 'ACTIVE',
        plannedSuspension: null,
      },
    ],
  },
]

context('Suspensions for external activities', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.stubEndpoint('GET', '/prisoner/G0995GW', getInmateDetails as unknown as JSON)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', getPrisonerAllocations)
    cy.stubEndpoint('GET', '/activities/12/filtered', activityInsidePaid as unknown as JSON)
    cy.stubEndpoint('GET', '/activities/14/filtered', activityOutsidePaid as unknown as JSON)
    cy.stubEndpoint('POST', '/allocations/MDI/suspend', {
      prisonerNumber: 'G0995GW',
      allocationIds: [2],
      suspendUntil: toDateString(new Date()),
    } as unknown as JSON)
  })

  it('should suspend an active in prison allocation immediately', () => {
    cy.signIn()
    cy.visit('/activities/suspensions/prisoner/G0995GW')
    const page = Page.verifyOnPage(ViewAllocationsPage)
    page.suspendLink(2).click()

    const suspendFromPage = Page.verifyOnPage(SuspendFromPage)
    suspendFromPage.selectRadio('immediately')
    suspendFromPage.continue()

    const suspensionPayPage = Page.verifyOnPage(SuspensionPayPage)
    suspensionPayPage.selectRadio('YES')
    suspensionPayPage.continue()

    const caseNoteQuestionPage = Page.verifyOnPage(CaseNoteQuestionPage)
    caseNoteQuestionPage.selectRadio('no')
    caseNoteQuestionPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.confirm()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.title().contains('Suspension started')
    confirmationPage.subtitle().contains('Alfonso Cholak (G0995GW) is now suspended from Active activity')

    cy.get('.govuk-body')
      .eq(0)
      .contains("While they are suspended, their attendance for this activity will be recorded as 'Suspended'.")
    cy.get('.govuk-body')
      .eq(1)
      .contains(
        'If they were due to attend a session that has already started, attendance for that session will need to be recorded.',
      )
    cy.get('.govuk-body')
      .eq(2)
      .contains('Unlock and movement lists for today may need to be printed again to show this suspension.')
  })

  it('should suspend an active in prison allocation from tomorrow', () => {
    cy.signIn()
    cy.visit('/activities/suspensions/prisoner/G0995GW')
    const tomorrow = addDays(new Date(), 1)
    const page = Page.verifyOnPage(ViewAllocationsPage)
    page.suspendLink(2).click()

    const suspendFromPage = Page.verifyOnPage(SuspendFromPage)
    suspendFromPage.selectRadio('tomorrow')
    suspendFromPage.continue()

    const suspensionPayPage = Page.verifyOnPage(SuspensionPayPage)
    suspensionPayPage.selectRadio('YES')
    suspensionPayPage.continue()

    const caseNoteQuestionPage = Page.verifyOnPage(CaseNoteQuestionPage)
    caseNoteQuestionPage.selectRadio('no')
    caseNoteQuestionPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.confirm()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.title().contains('Suspension added')
    confirmationPage
      .subtitle()
      .contains(
        `Alfonso Cholak (G0995GW) will be suspended from Active activity from ${format(tomorrow, 'd MMMM yyyy')}`,
      )

    cy.get('.govuk-body')
      .eq(0)
      .contains(
        `From ${format(tomorrow, 'd MMMM yyyy')}, their attendance for this activity will be recorded as 'Suspended'.`,
      )
  })

  it('should suspend an active outside prison allocation immediately', () => {
    cy.signInEAEnabled()
    cy.visit('/activities/suspensions/prisoner/G0995GW')
    const page = Page.verifyOnPage(ViewAllocationsPage)
    page.suspendLink(4).click()

    const suspendFromPage = Page.verifyOnPage(SuspendFromPage)
    suspendFromPage.selectRadio('immediately')
    suspendFromPage.continue()

    const suspensionPayPage = Page.verifyOnPage(SuspensionPayPage)
    suspensionPayPage.selectRadio('YES')
    suspensionPayPage.continue()

    const caseNoteQuestionPage = Page.verifyOnPage(CaseNoteQuestionPage)
    caseNoteQuestionPage.selectRadio('no')
    caseNoteQuestionPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.confirm()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.title().contains('Suspension started')
    confirmationPage.subtitle().contains('Alfonso Cholak (G0995GW) is now suspended from Hotel')

    cy.get('.govuk-body')
      .eq(0)
      .contains("While they are suspended, their attendance for this activity will be recorded as 'Suspended'.")
    cy.get('.govuk-body')
      .eq(1)
      .contains(
        'If they were due to attend a session that has already started, attendance for that session will need to be recorded.',
      )
    cy.get('.govuk-body')
      .eq(2)
      .contains(
        'Temporary absences for Alfonso Cholak to go out to this activity should be cancelled. Unlock and movement lists for today may need to be printed again.',
      )
  })

  it('should suspend an active outside prison allocation from tomorrow', () => {
    cy.signInEAEnabled()
    cy.visit('/activities/suspensions/prisoner/G0995GW')
    const tomorrow = addDays(new Date(), 1)
    const page = Page.verifyOnPage(ViewAllocationsPage)
    page.suspendLink(4).click()

    const suspendFromPage = Page.verifyOnPage(SuspendFromPage)
    suspendFromPage.selectRadio('tomorrow')
    suspendFromPage.continue()

    const suspensionPayPage = Page.verifyOnPage(SuspensionPayPage)
    suspensionPayPage.selectRadio('YES')
    suspensionPayPage.continue()

    const caseNoteQuestionPage = Page.verifyOnPage(CaseNoteQuestionPage)
    caseNoteQuestionPage.selectRadio('no')
    caseNoteQuestionPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.confirm()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.title().contains('Suspension added')
    confirmationPage
      .subtitle()
      .contains(`Alfonso Cholak (G0995GW) will be suspended from Hotel from ${format(tomorrow, 'd MMMM yyyy')}`)

    cy.get('.govuk-body')
      .eq(0)
      .contains(
        `From ${format(tomorrow, 'd MMMM yyyy')}, their attendance for this activity will be recorded as 'Suspended'.`,
      )
    cy.get('.govuk-body')
      .eq(1)
      .contains('Temporary absences for Alfonso Cholak to go out to this activity should be cancelled.')
  })
})
