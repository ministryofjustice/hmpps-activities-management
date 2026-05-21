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

const activityInsideUnpaid = {
  id: 11,
  paid: false,
  pay: null,
  outsideWork: false,
} as unknown as Activity

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

const activityOutsideUnpaid = {
  id: 13,
  paid: false,
  pay: null,
  outsideWork: true,
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
        id: 1,
        prisonerNumber: 'G0995GW',
        bookingId: 1068066,
        activitySummary: "Nat's unpaid stuff",
        activityId: 11,
        scheduleId: 902,
        prisonPayBand: null,
        startDate: '2024-12-09',
        endDate: null,
        status: 'SUSPENDED',
        plannedSuspension: null,
      },
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
        id: 3,
        prisonerNumber: 'G0995GW',
        bookingId: 1068066,
        activitySummary: 'Outside Cafe',
        activityId: 13,
        scheduleId: 902,
        prisonPayBand: null,
        startDate: '2024-12-09',
        endDate: null,
        status: 'SUSPENDED',
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
    cy.stubEndpoint('GET', '/activities/11/filtered', activityInsideUnpaid as unknown as JSON)
    cy.stubEndpoint('GET', '/activities/12/filtered', activityInsidePaid as unknown as JSON)
    cy.stubEndpoint('GET', '/activities/13/filtered', activityOutsideUnpaid as unknown as JSON)
    cy.stubEndpoint('GET', '/activities/14/filtered', activityOutsidePaid as unknown as JSON)
    cy.stubEndpoint('POST', '/allocations/MDI/suspend', {
      prisonerNumber: 'G0995GW',
      allocationIds: [2],
      suspendUntil: toDateString(new Date()),
    } as unknown as JSON)
    cy.signIn()
  })

  it('should suspend an active allocation immediately', () => {
    cy.visit('/activities/suspensions/prisoner/G0995GW')
    const page = Page.verifyOnPage(ViewAllocationsPage)
    page.caption().should('contain.text', 'Manage suspensions')
    page.title().should('contain.text', "Alfonso Cholak's activities")
    page.suspendLink(2).click()

    const suspendFromPage = Page.verifyOnPage(SuspendFromPage)
    suspendFromPage.caption().should('contain.text', 'Manage suspensions')
    suspendFromPage.title().should('contain.text', "When does Alfonso Cholak's suspension from Active activity start?")
    suspendFromPage.selectRadio('immediately')
    suspendFromPage.continue()

    const suspensionPayPage = Page.verifyOnPage(SuspensionPayPage)
    suspensionPayPage.selectRadio('YES')
    suspensionPayPage.continue()

    const caseNoteQuestionPage = Page.verifyOnPage(CaseNoteQuestionPage)
    caseNoteQuestionPage.selectRadio('no')
    caseNoteQuestionPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage
      .summary()
      .find('dt')
      .then($dt => {
        expect($dt.get(0).innerText).to.contain('Prisoner')
        expect($dt.get(1).innerText).to.contain('Activity')
        expect($dt.get(2).innerText).to.contain('First day of suspension')
        expect($dt.get(3).innerText).to.contain('Paid while suspended?')
        expect($dt.get(4).innerText).to.contain('Do you want to add a case note?')
      })
    checkAnswersPage
      .summary()
      .find('dd')
      .then($dd => {
        expect($dd.get(0).innerText).to.contain('Alfonso Cholak\nG0995GW')
        expect($dd.get(1).innerText).to.contain('Active activity')
        expect($dd.get(2).innerText).to.contain('Today - suspension starts immediately')
        expect($dd.get(4).innerText).to.contain('Yes')
        expect($dd.get(6).innerText).to.contain('No')
      })
    checkAnswersPage.confirm()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.title().should('contain.text', 'Suspension started')
  })
})
