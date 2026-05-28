import { addDays } from 'date-fns'
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
import ViewSuspensionPage from '../../../pages/activities/suspensions/viewSuspension'
import SuspendUntilPage from '../../../pages/activities/suspensions/suspendUntil'

const activity539 = {
  paid: true,
  pay: [
    {
      prisonPayBand: { id: 314 },
      incentiveLevel: 'Standard',
      startDate: null,
      rate: 100,
    },
  ],
} as unknown as Activity
const activityUnpaid = {
  paid: false,
  pay: null,
} as unknown as Activity
const activity123 = {
  paid: true,
  pay: [
    {
      prisonPayBand: { id: 315 },
      incentiveLevel: 'Standard',
      startDate: null,
      rate: 100,
    },
  ],
} as unknown as Activity
const activitiesAllSuspendedTogether = [
  {
    prisonerNumber: '',
    allocations: [
      {
        id: 7509,
        prisonerNumber: 'G0995GW',
        bookingId: 1068066,
        activitySummary: "Dave's Cake Making",
        activityId: 778,
        scheduleId: 757,
        prisonPayBand: {
          id: 312,
          displaySequence: 1,
          alias: 'Pay band 1 (Lowest)',
          description: 'Pay band 1 (Lowest)',
          nomisPayBand: 1,
          prisonCode: 'RSI',
          createdTime: null,
          createdBy: null,
          updatedTime: null,
          updatedBy: null,
        },
        startDate: '2024-11-14',
        endDate: null,
        status: 'SUSPENDED_WITH_PAY',
        plannedSuspension: {
          plannedStartDate: '2024-12-13',
          plannedEndDate: null,
          caseNoteId: null,
          dpsCaseNoteId: null,
          plannedBy: 'USER1',
          plannedAt: '2024-12-13T14:40:02.594376',
          paid: true,
        },
      },
      {
        id: 7509,
        prisonerNumber: 'G0995GW',
        bookingId: 1068066,
        activitySummary: 'Unpaid activity',
        activityId: 778,
        scheduleId: 757,
        prisonPayBand: null,
        startDate: '2024-11-14',
        endDate: null,
        status: 'SUSPENDED_WITH_PAY',
        plannedSuspension: {
          plannedStartDate: '2024-12-13',
          plannedEndDate: null,
          caseNoteId: null,
          dpsCaseNoteId: null,
          plannedBy: 'USER1',
          plannedAt: '2024-12-13T14:40:02.594376',
          paid: true,
        },
      },
    ],
  },
]
const getActivePrisonerAllocations = [
  {
    prisonerNumber: 'G0995GW',
    allocations: [
      {
        id: 1234,
        prisonerNumber: 'G0995GW',
        bookingId: 1058066,
        activitySummary: 'Activity 1',
        activityId: 123,
        scheduleId: 234,
        prisonPayBand: {
          id: 315,
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
        id: 2345,
        prisonerNumber: 'G0995GW',
        bookingId: 1058066,
        activitySummary: 'Activity 2',
        activityId: 234,
        scheduleId: 555,
        prisonPayBand: null,
        startDate: '2024-12-09',
        endDate: null,
        status: 'ACTIVE',
        plannedSuspension: null,
      },
    ],
  },
]

context('Bulk suspend/unsuspend', () => {
  const allocationsSuspendedSeparately = [
    {
      prisonerNumber: 'G0995GW',
      allocations: [
        {
          id: 7509,
          prisonerNumber: 'G0995GW',
          bookingId: 1068066,
          activitySummary: "Dave's Cake Making",
          activityId: 778,
          scheduleId: 757,
          prisonPayBand: {
            id: 312,
            displaySequence: 1,
            alias: 'Pay band 1 (Lowest)',
            description: 'Pay band 1 (Lowest)',
            nomisPayBand: 1,
            prisonCode: 'RSI',
            createdTime: null,
            createdBy: null,
            updatedTime: null,
            updatedBy: null,
          },
          startDate: '2024-11-14',
          endDate: null,
          suspendedTime: '2024-12-16T15:22:50',
          suspendedBy: 'USER1',
          suspendedReason: 'Planned suspension',
          status: 'SUSPENDED',
          plannedSuspension: {
            plannedStartDate: '2024-12-16',
            plannedEndDate: null,
            caseNoteId: null,
            dpsCaseNoteId: null,
            plannedBy: 'USER1',
            plannedAt: '2024-12-16T15:22:50.538551',
            paid: false,
          },
        },
        {
          id: 4188,
          prisonerNumber: 'G0995GW',
          bookingId: 1068066,
          activitySummary: 'A Wing Cleaner 2',
          activityId: 539,
          scheduleId: 518,
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
          startDate: '2023-10-24',
          endDate: null,
          suspendedBy: 'USER1',
          suspendedReason: 'Planned suspension',
          status: 'SUSPENDED_WITH_PAY',
          plannedDeallocation: null,
          plannedSuspension: {
            plannedStartDate: '2024-12-16',
            plannedEndDate: null,
            caseNoteId: null,
            dpsCaseNoteId: null,
            plannedBy: 'USER1',
            plannedAt: '2024-12-16T15:22:32.694814',
            paid: true,
          },
        },
        {
          id: 7528,
          prisonerNumber: 'G0995GW',
          bookingId: 1068066,
          activitySummary: "Nat's unpaid stuff",
          activityId: 923,
          scheduleId: 902,
          prisonPayBand: null,
          startDate: '2024-12-09',
          endDate: null,
          suspendedTime: '2024-12-16T15:23:33',
          suspendedBy: 'USER1',
          suspendedReason: 'Planned suspension',
          status: 'SUSPENDED',
          plannedDeallocation: null,
          plannedSuspension: {
            plannedStartDate: '2024-12-16',
            plannedEndDate: null,
            caseNoteId: null,
            dpsCaseNoteId: null,
            plannedBy: 'USER1',
            plannedAt: '2024-12-16T15:23:33.734918',
            paid: false,
          },
        },
        {
          id: 1234,
          prisonerNumber: 'G0995GW',
          bookingId: 1058066,
          activitySummary: 'Activity - suspended from tomorrow',
          activityId: 123,
          scheduleId: 234,
          prisonPayBand: {
            id: 315,
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
          plannedSuspension: {
            plannedStartDate: toDateString(addDays(new Date(), 1)),
            plannedEndDate: null,
            caseNoteId: null,
            dpsCaseNoteId: null,
            plannedBy: 'USER1',
            plannedAt: '2024-12-13T14:40:02.594376',
            paid: true,
          },
        },
      ],
    },
  ]

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.stubEndpoint('GET', '/activities/234/filtered', activityUnpaid as unknown as JSON)
    cy.stubEndpoint('GET', '/activities/123/filtered', activity123 as unknown as JSON)
    cy.stubEndpoint('GET', '/activities/778/filtered', activityUnpaid as unknown as JSON)
    cy.stubEndpoint('GET', '/activities/539/filtered', activity539 as unknown as JSON)
    cy.stubEndpoint('GET', '/activities/923/filtered', activityUnpaid as unknown as JSON)
    cy.stubEndpoint('GET', '/prisoner/G0995GW', getInmateDetails as unknown as JSON)
    cy.stubEndpoint('POST', '/allocations/MDI/suspend', {
      prisonerNumber: 'G0995GW',
      allocationIds: [1234, 2345],
      suspendUntil: toDateString(new Date()),
    } as unknown as JSON)
    cy.stubEndpoint('POST', '/allocations/MDI/unsuspend', {
      prisonerNumber: 'G0995GW',
      allocationIds: [7509, 539, 923, 123],
      suspendFrom: toDateString(new Date()),
    } as unknown as JSON)
    cy.signIn()
  })
  it('should be able to suspend all active allocations at once', () => {
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', getActivePrisonerAllocations)

    cy.visit('/activities/suspensions/prisoner/G0995GW')
    const page = Page.verifyOnPage(ViewAllocationsPage)
    page.suspendAllButton().click()
    const suspendFromPage = Page.verifyOnPage(SuspendFromPage)
    suspendFromPage.selectRadio('immediately')
    suspendFromPage.continue()
    const payPage = Page.verifyOnPage(SuspensionPayPage)
    payPage
      .hintText()
      .should('include.text', 'Alfonso Cholak is currently paid for 1 of 2 activities you’re suspending them from:')
      .should('include.text', 'Activity 1')
    payPage.selectRadio('YES')
    payPage.continue()
    const caseNotePage = Page.verifyOnPage(CaseNoteQuestionPage)
    caseNotePage.selectRadio('no')
    caseNotePage.continue()
    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage
      .summary()
      .find('dd')
      .then($dd => {
        expect($dd.get(0).innerText).to.contain('Alfonso Cholak\nG0995GW')
        expect($dd.get(1).innerText).to.contain('Activity 1')
        expect($dd.get(1).innerText).to.contain('Activity 2')
        expect($dd.get(2).innerText).to.contain('Today - suspension starts immediately')
        expect($dd.get(4).innerText).to.contain('Yes')
        expect($dd.get(6).innerText).to.contain('No')
      })
    checkAnswersPage.confirm()
    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.subtitle().should('include.text', 'Alfonso Cholak (G0995GW) is now suspended from')
    confirmationPage.subtitle().should('include.text', '2 activities')
  })
  it('should be able to end all suspended allocations at once', () => {
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', allocationsSuspendedSeparately)
    cy.visit('/activities/suspensions/prisoner/G0995GW')
    const page = Page.verifyOnPage(ViewAllocationsPage)
    page.endAllButton().click()
    const viewSuspensionPage = Page.verifyOnPage(ViewSuspensionPage)
    viewSuspensionPage
      .summary()
      .eq(0)
      .find('dd')
      .then($dd => {
        expect($dd.get(0).innerText).to.contain('Activity - suspended from tomorrow')
        expect($dd.get(3).innerText).to.contain('Yes')
      })
    viewSuspensionPage
      .summary()
      .eq(1)
      .find('dd')
      .then($dd => {
        expect($dd.get(0).innerText).to.contain('A Wing Cleaner 2')
        expect($dd.get(3).innerText).to.contain('Yes')
      })
    viewSuspensionPage
      .summary()
      .eq(2)
      .find('dd')
      .then($dd => {
        expect($dd.get(0).innerText).to.contain("Dave's Cake Making")
        expect($dd.get(3).innerText).to.contain('No')
      })
    viewSuspensionPage
      .summary()
      .eq(3)
      .find('dd')
      .then($dd => {
        expect($dd.get(0).innerText).to.contain("Nat's unpaid stuff")
        expect($dd.get(3).innerText).to.contain('No - activity is unpaid')
      })
    viewSuspensionPage.endAllSuspensionButton()

    const suspendUntil = Page.verifyOnPage(SuspendUntilPage)
    suspendUntil.selectRadio('immediately')
    suspendUntil.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage
      .summary()
      .find('dt')
      .then($dt => {
        expect($dt.get(0).innerText).to.contain('Prisoner')
        expect($dt.get(1).innerText).to.contain('Activity')
        expect($dt.get(2).innerText).to.contain('Last day of suspension')
      })
    checkAnswersPage
      .summary()
      .find('dd')
      .then($dd => {
        expect($dd.get(0).innerText).to.contain('Alfonso Cholak\nG0995GW')
        expect($dd.get(1).innerText).to.contain('A Wing Cleaner 2')
        expect($dd.get(1).innerText).to.contain("Dave's Cake Making")
        expect($dd.get(1).innerText).to.contain("Nat's unpaid stuff")
        expect($dd.get(2).innerText).to.contain('Immediately')
      })
    checkAnswersPage.confirm()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.title().should('contain.text', 'Suspension ended')
    confirmationPage.manageAllocationsLink().should('exist')
  })
  it('should display unpaid activities as unpaid even if it has the paid tag (occurs if all activities are suspended together)', () => {
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', activitiesAllSuspendedTogether)
    cy.visit('/activities/suspensions/prisoner/G0995GW')
    const page = Page.verifyOnPage(ViewAllocationsPage)
    page
      .suspendedAllocationsTable()
      .find('td')
      .then($data => {
        expect($data.get(0).innerText).to.contain("Dave's Cake Making")
        expect($data.get(3).innerText).to.contain('Yes')
        expect($data.get(5).innerText).to.contain('Unpaid activity')
        expect($data.get(8).innerText).to.contain('No - activity is unpaid')
      })
  })
})
