import { addDays, formatDate } from 'date-fns'
import getInmateDetails from '../../fixtures/prisonerSearchApi/getPrisoner-MDI-A5015DY.json'
import config from '../../../server/config'
import { Activity } from '../../../server/@types/activitiesAPI/types'
import ViewAllocationsPage from '../../pages/activities/suspensions/viewAllocations'
import Page from '../../pages/page'
import { toDateString } from '../../../server/utils/utils'
import SuspendFromPage from '../../pages/activities/suspensions/suspendFrom'
import SuspensionPayPage from '../../pages/activities/suspensions/pay'
import CaseNoteQuestionPage from '../../pages/activities/suspensions/caseNoteQuestion'
import CheckAnswersPage from '../../pages/activities/suspensions/checkAnswers'
import ConfirmationPage from '../../pages/activities/suspensions/confirmation'
import ViewSuspensionPage from '../../pages/activities/suspensions/viewSuspension'
import SuspendUntilPage from '../../pages/activities/suspensions/suspendUntil'

const activity778 = {
  paid: true,
  pay: [
    {
      prisonPayBand: { id: 312 },
      incentiveLevel: 'Standard',
      startDate: null,
      rate: 100,
    },
  ],
} as unknown as Activity
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
} as Activity

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
const activity546 = {
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

const getPrisonerAllocations = [
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
        status: 'SUSPENDED_WITH_PAY',
        plannedSuspension: {
          plannedStartDate: '2024-12-13',
          plannedEndDate: null,
          caseNoteId: null,
          plannedBy: 'NCLAMP_GEN',
          plannedAt: '2024-12-13T14:40:02.594376',
          paid: true,
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
        status: 'SUSPENDED',
        plannedSuspension: {
          plannedStartDate: '2024-12-12',
          plannedEndDate: toDateString(addDays(new Date(), 3)),
          caseNoteId: null,
          plannedBy: 'NCLAMP_GEN',
          plannedAt: '2024-12-13T14:40:02.594376',
          paid: false,
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
        status: 'SUSPENDED',
        plannedSuspension: {
          plannedStartDate: '2024-12-11',
          plannedEndDate: null,
          caseNoteId: null,
          plannedBy: 'NCLAMP_GEN',
          plannedAt: '2024-12-13T14:40:02.594376',
          paid: null,
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
          plannedBy: 'NCLAMP_GEN',
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

context('Suspensions', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.stubEndpoint('GET', '/activities/778/filtered', activity778 as unknown as JSON)
    cy.stubEndpoint('GET', '/activities/539/filtered', activity539 as unknown as JSON)
    cy.stubEndpoint('GET', '/activities/923/filtered', activityUnpaid as unknown as JSON)
    cy.stubEndpoint('GET', '/activities/999/filtered', activityUnpaid as unknown as JSON)
    cy.stubEndpoint('GET', '/activities/234/filtered', activityUnpaid as unknown as JSON)
    cy.stubEndpoint('GET', '/activities/123/filtered', activity123 as unknown as JSON)
    cy.stubEndpoint('GET', '/activities/546/filtered', activity546 as unknown as JSON)
    cy.stubEndpoint('GET', '/prisoner/G0995GW', getInmateDetails)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', getPrisonerAllocations)
    cy.stubEndpoint('POST', '/allocations/MDI/suspend', {
      prisonerNumber: 'G0995GW',
      allocationIds: [9876],
      suspendUntil: toDateString(new Date()),
    } as unknown as JSON)
    cy.stubEndpoint('POST', '/allocations/MDI/unsuspend', {
      prisonerNumber: 'G0995GW',
      allocationIds: [7528],
      suspendFrom: toDateString(new Date()),
    } as unknown as JSON)
    cy.signIn()
    config.suspendPrisonerWithPayToggleEnabled = true
  })
  it('should render the page, all suspended', () => {
    cy.visit('/activities/suspensions/prisoner/G0995GW')
    const page = Page.verifyOnPage(ViewAllocationsPage)
    page.caption().should('contain.text', 'Manage suspensions from activities')
    page.title().should('contain.text', "Alfonso Cholak's activities")
    page
      .noActiveAllocationsPara()
      .should('contain.text', "Alfonso Cholak is currently suspended from every activity that they're allocated to.")
    page.activeAllocationsTable().should('not.exist')
    page.suspendedTableH2().should('contain.text', 'Alfonso Cholak’s suspensions')
    page
      .suspendedAllocationsTable()
      .find('th')
      .then($headers => {
        expect($headers.get(0).innerText).to.contain('Activity')
        expect($headers.get(1).innerText).to.contain('Suspension start date')
        expect($headers.get(2).innerText).to.contain('Suspension end date')
        expect($headers.get(3).innerText).to.contain('Paid while suspended?')
        expect($headers.get(4).innerText).to.contain('')
      })
    page
      .suspendedAllocationsTable()
      .find('td')
      .then($data => {
        expect($data.get(0).innerText).to.contain("Nat's unpaid stuff")
        expect($data.get(1).innerText).to.contain('11 December 2024')
        expect($data.get(2).innerText).to.contain('No end date set')
        expect($data.get(3).innerText).to.contain('No - activity is unpaid')
        expect($data.get(4).innerText).to.contain('View or end suspension')
        expect($data.get(5).innerText).to.contain('A Wing Cleaner 2')
        expect($data.get(6).innerText).to.contain('12 December 2024')
        expect($data.get(7).innerText).to.contain(formatDate(toDateString(addDays(new Date(), 3)), 'd MMMM yyyy'))
        expect($data.get(8).innerText).to.contain('No')
        expect($data.get(9).innerText).to.contain('View or end suspension')
        expect($data.get(10).innerText).to.contain("Dave's Cake Making")
        expect($data.get(11).innerText).to.contain('13 December 2024')
        expect($data.get(12).innerText).to.contain('No end date set')
        expect($data.get(13).innerText).to.contain('Yes')
        expect($data.get(14).innerText).to.contain('View or end suspension')
        expect($data.get(15).innerText).to.contain('Activity - suspended from tomorrow')
        expect($data.get(16).innerText).to.contain(formatDate(toDateString(addDays(new Date(), 1)), 'd MMMM yyyy'))
        expect($data.get(17).innerText).to.contain('No end date set')
        expect($data.get(18).innerText).to.contain('Yes')
        expect($data.get(19).innerText).to.contain('View or end suspension')
      })
    page.endAllButton().should('exist')
    page.suspendAllButton().should('not.exist')
    page.endAllButton().click()
  })
  it('should render the page, some suspended and some active', () => {
    const activeAllocation = [
      {
        id: 9876,
        prisonerNumber: 'G0995GW',
        bookingId: 1058066,
        activitySummary: 'Active activity',
        activityId: 546,
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
        id: 4765,
        prisonerNumber: 'G0995GW',
        bookingId: 1058066,
        activitySummary: 'Active unpaid activity',
        activityId: 999,
        scheduleId: 345,
        prisonPayBand: null,
        startDate: '2024-12-10',
        endDate: null,
        status: 'ACTIVE',
        plannedSuspension: null,
      },
    ]
    getPrisonerAllocations[0].allocations.push(...activeAllocation)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', getPrisonerAllocations)

    cy.visit('/activities/suspensions/prisoner/G0995GW')
    const page = Page.verifyOnPage(ViewAllocationsPage)
    page.caption().should('contain.text', 'Manage suspensions from activities')
    page.title().should('contain.text', "Alfonso Cholak's activities")
    page.noActiveAllocationsPara().should('not.exist')
    page
      .activeAllocationsTable()
      .find('th')
      .then($headers => {
        expect($headers.get(0).innerText).to.contain('Activity')
        expect($headers.get(1).innerText).to.contain('Allocation start date')
        expect($headers.get(2).innerText).to.contain('Allocation end date')
        expect($headers.get(3).innerText).to.contain('Pay rate')
        expect($headers.get(4).innerText).to.contain('')
      })
    page
      .activeAllocationsTable()
      .find('td')
      .then($data => {
        expect($data.get(0).innerText).to.contain('Active activity')
        expect($data.get(1).innerText).to.contain('9 December 2024')
        expect($data.get(2).innerText).to.contain('No end date set')
        expect($data.get(3).innerText).to.contain('£1.00')
        expect($data.get(4).innerText).to.contain('')
        expect($data.get(5).innerText).to.contain('Active unpaid activity')
        expect($data.get(6).innerText).to.contain('10 December 2024')
        expect($data.get(7).innerText).to.contain('No end date set')
        expect($data.get(8).innerText).to.contain('Unpaid')
        expect($data.get(9).innerText).to.contain('')
      })

    page.suspendedTableH2().should('contain.text', 'Alfonso Cholak’s suspensions')
    page
      .suspendedAllocationsTable()
      .find('th')
      .then($headers => {
        expect($headers.get(0).innerText).to.contain('Activity')
        expect($headers.get(1).innerText).to.contain('Suspension start date')
        expect($headers.get(2).innerText).to.contain('Suspension end date')
        expect($headers.get(3).innerText).to.contain('Paid while suspended?')
        expect($headers.get(4).innerText).to.contain('')
      })
    page
      .suspendedAllocationsTable()
      .find('td')
      .then($data => {
        expect($data.get(0).innerText).to.contain("Nat's unpaid stuff")
        expect($data.get(1).innerText).to.contain('11 December 2024')
        expect($data.get(2).innerText).to.contain('No end date set')
        expect($data.get(3).innerText).to.contain('No - activity is unpaid')
        expect($data.get(4).innerText).to.contain('View or end suspension')
        expect($data.get(5).innerText).to.contain('A Wing Cleaner 2')
        expect($data.get(6).innerText).to.contain('12 December 2024')
        expect($data.get(7).innerText).to.contain(formatDate(toDateString(addDays(new Date(), 3)), 'd MMMM yyyy'))
        expect($data.get(8).innerText).to.contain('No')
        expect($data.get(9).innerText).to.contain('View or end suspension')
        expect($data.get(10).innerText).to.contain("Dave's Cake Making")
        expect($data.get(11).innerText).to.contain('13 December 2024')
        expect($data.get(12).innerText).to.contain('No end date set')
        expect($data.get(13).innerText).to.contain('Yes')
        expect($data.get(14).innerText).to.contain('View or end suspension')
        expect($data.get(15).innerText).to.contain('Activity - suspended from tomorrow')
        expect($data.get(16).innerText).to.contain(formatDate(toDateString(addDays(new Date(), 1)), 'd MMMM yyyy'))
        expect($data.get(17).innerText).to.contain('No end date set')
        expect($data.get(18).innerText).to.contain('Yes')
        expect($data.get(19).innerText).to.contain('View or end suspension')
      })
    page.endAllButton().should('not.exist')
    page.suspendAllButton().should('not.exist')
  })
  it('should suspend an active allocation immediately', () => {
    cy.visit('/activities/suspensions/prisoner/G0995GW')
    const page = Page.verifyOnPage(ViewAllocationsPage)
    page.caption().should('contain.text', 'Manage suspensions from activities')
    page.title().should('contain.text', "Alfonso Cholak's activities")
    page.suspendLink(9876).click()

    const suspendFromPage = Page.verifyOnPage(SuspendFromPage)
    suspendFromPage.caption().should('contain.text', 'Manage suspensions from activities')
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
        expect($dt.get(2).innerText).to.contain('Start of suspension')
        expect($dt.get(3).innerText).to.contain('Paid while suspended?')
        expect($dt.get(4).innerText).to.contain('Do you want to add a case note?')
      })
    checkAnswersPage
      .summary()
      .find('dd')
      .then($dd => {
        expect($dd.get(0).innerText).to.contain('Alfonso Cholak\nG0995GW')
        expect($dd.get(1).innerText).to.contain('Active activity')
        expect($dd.get(2).innerText).to.contain('Immediately')
        expect($dd.get(4).innerText).to.contain('Yes')
        expect($dd.get(6).innerText).to.contain('No')
      })
    checkAnswersPage.confirm()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.title().should('contain.text', 'Suspension started')
  })
  it('should not ask the pay question if the activity is unpaid', () => {
    cy.visit('/activities/suspensions/prisoner/G0995GW')
    const page = Page.verifyOnPage(ViewAllocationsPage)
    page.caption().should('contain.text', 'Manage suspensions from activities')
    page.title().should('contain.text', "Alfonso Cholak's activities")
    page.suspendLink(4765).click()

    const suspendFromPage = Page.verifyOnPage(SuspendFromPage)
    suspendFromPage.caption().should('contain.text', 'Manage suspensions from activities')
    suspendFromPage
      .title()
      .should('contain.text', "When does Alfonso Cholak's suspension from Active unpaid activity start?")
    suspendFromPage.selectRadio('immediately')
    suspendFromPage.continue()

    //  skips pay question page
    Page.verifyOnPage(CaseNoteQuestionPage)
  })
  it('should unsuspend a prisoner from an activity - unpaid activity', () => {
    cy.visit('/activities/suspensions/prisoner/G0995GW')
    const page = Page.verifyOnPage(ViewAllocationsPage)
    page.caption().should('contain.text', 'Manage suspensions from activities')
    page.title().should('contain.text', "Alfonso Cholak's activities")
    page.endSuspensionLink(7528).click()

    const viewSuspensionPage = Page.verifyOnPage(ViewSuspensionPage)
    viewSuspensionPage
      .summary()
      .find('dt')
      .then($dt => {
        expect($dt.get(0).innerText).to.contain('Activity')
        expect($dt.get(1).innerText).to.contain('Suspension start date')
        expect($dt.get(2).innerText).to.contain('Suspension end date')
        expect($dt.get(3).innerText).to.contain('Paid while suspended?')
        expect($dt.get(4).innerText).to.contain('Added by')
      })
    viewSuspensionPage
      .summary()
      .find('dd')
      .then($dd => {
        expect($dd.get(0).innerText).to.contain("Nat's unpaid stuff")
        expect($dd.get(1).innerText).to.contain('Wednesday, 11 December 2024')
        expect($dd.get(2).innerText).to.contain('No end date')
        expect($dd.get(3).innerText).to.contain('No - activity is unpaid')
      })
    viewSuspensionPage.endSuspensionButton()

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
        expect($dt.get(2).innerText).to.contain('End of suspension')
      })
    checkAnswersPage
      .summary()
      .find('dd')
      .then($dd => {
        expect($dd.get(0).innerText).to.contain('Alfonso Cholak\nG0995GW')
        expect($dd.get(1).innerText).to.contain("Nat's unpaid stuff")
        expect($dd.get(2).innerText).to.contain('Immediately')
      })
    checkAnswersPage.confirm()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.title().should('contain.text', 'Suspension ended')
  })
  it('should unsuspend a prisoner from an activity - paid activity - should show correctly on view suspensions', () => {
    cy.visit('/activities/suspensions/prisoner/G0995GW')
    const page = Page.verifyOnPage(ViewAllocationsPage)
    page.endSuspensionLink(7509).click()

    const viewSuspensionPage = Page.verifyOnPage(ViewSuspensionPage)
    viewSuspensionPage
      .summary()
      .find('dd')
      .then($dd => {
        expect($dd.get(0).innerText).to.contain("Dave's Cake Making")
        expect($dd.get(3).innerText).to.contain('Yes')
      })
    viewSuspensionPage.endSuspensionButton()
  })
  it('should unsuspend a prisoner from an activity - paid activity but not paid during suspension - should show correctly on view suspensions', () => {
    cy.visit('/activities/suspensions/prisoner/G0995GW')
    const page = Page.verifyOnPage(ViewAllocationsPage)
    page.endSuspensionLink(4188).click()

    const viewSuspensionPage = Page.verifyOnPage(ViewSuspensionPage)
    viewSuspensionPage
      .summary()
      .find('dd')
      .then($dd => {
        expect($dd.get(0).innerText).to.contain('A Wing Cleaner 2')
        expect($dd.get(3).innerText).to.contain('No')
      })
    viewSuspensionPage.endSuspensionButton()
  })
})

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
          suspendedBy: 'NCLAMP_GEN',
          suspendedReason: 'Planned suspension',
          status: 'SUSPENDED',
          plannedSuspension: {
            plannedStartDate: '2024-12-16',
            plannedEndDate: null,
            caseNoteId: null,
            plannedBy: 'NCLAMP_GEN',
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
          suspendedBy: 'NCLAMP_GEN',
          suspendedReason: 'Planned suspension',
          status: 'SUSPENDED_WITH_PAY',
          plannedDeallocation: null,
          plannedSuspension: {
            plannedStartDate: '2024-12-16',
            plannedEndDate: null,
            caseNoteId: null,
            plannedBy: 'NCLAMP_GEN',
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
          suspendedBy: 'NCLAMP_GEN',
          suspendedReason: 'Planned suspension',
          status: 'SUSPENDED',
          plannedDeallocation: null,
          plannedSuspension: {
            plannedStartDate: '2024-12-16',
            plannedEndDate: null,
            caseNoteId: null,
            plannedBy: 'NCLAMP_GEN',
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
            plannedBy: 'NCLAMP_GEN',
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
    cy.stubEndpoint('GET', '/prisoner/G0995GW', getInmateDetails)
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
    config.suspendPrisonerWithPayToggleEnabled = true
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
        expect($dd.get(1).innerText).to.contain('All activities')
        expect($dd.get(2).innerText).to.contain('Immediately')
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
        expect($dt.get(2).innerText).to.contain('End of suspension')
      })
    checkAnswersPage
      .summary()
      .find('dd')
      .then($dd => {
        expect($dd.get(0).innerText).to.contain('Alfonso Cholak\nG0995GW')
        expect($dd.get(1).innerText).to.contain('All activities')
        expect($dd.get(2).innerText).to.contain('Immediately')
      })
    checkAnswersPage.confirm()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.title().should('contain.text', 'Suspension ended')
  })
})
