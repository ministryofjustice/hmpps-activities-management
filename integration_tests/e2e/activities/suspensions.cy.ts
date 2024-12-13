import { addDays, formatDate } from 'date-fns'
import getInmateDetails from '../../fixtures/prisonerSearchApi/getPrisoner-MDI-A5015DY.json'
import config from '../../../server/config'
import { Activity } from '../../../server/@types/activitiesAPI/types'
import ViewAllocationsPage from '../../pages/activities/suspensions/viewAllocations'
import Page from '../../pages/page'
import { toDateString } from '../../../server/utils/utils'

const activity778 = {
  paid: true,
} as Activity
const activity539 = {
  paid: false,
} as Activity
const activity923 = {
  paid: false,
} as Activity
const activity123 = {
  paid: true,
} as Activity

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
        prisonPayBand: null,
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

context('Suspensions', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.stubEndpoint('GET', '/activities/778/filtered', activity778 as unknown as JSON)
    cy.stubEndpoint('GET', '/activities/539/filtered', activity539 as unknown as JSON)
    cy.stubEndpoint('GET', '/activities/923/filtered', activity923 as unknown as JSON)
    cy.stubEndpoint('GET', '/activities/123/filtered', activity123 as unknown as JSON)
    cy.stubEndpoint('GET', '/prisoner/G0995GW', getInmateDetails)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', getPrisonerAllocations)
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
        expect($data.get(16).innerText).to.contain('14 December 2024')
        expect($data.get(17).innerText).to.contain('No end date set')
        expect($data.get(18).innerText).to.contain('Yes')
        expect($data.get(19).innerText).to.contain('View or end suspension')
      })
    page.endAllButton().should('exist')
    page.suspendAllButton().should('not.exist')
    page.endAllButton().click()
  })
})
