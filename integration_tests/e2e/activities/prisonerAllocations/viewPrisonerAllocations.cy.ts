import prisonerAllocations from '../../../fixtures/prisonerAllocations/getPrisonerAllocations-60995GW.json'
import prisonerDetails from '../../../fixtures/prisonerSearchApi/getPrisonerDetails-G0995GW.json'
import prisonerNonAssociations from '../../../fixtures/nonAssociationsApi/getNonAssociations-G0995GW.json'
import getActivities from '../../../fixtures/prisonerAllocations/getPrisonerWaitlistActivities.json'
import getActivity from '../../../fixtures/activitiesApi/getActivity.json'
import rolloutPlan from '../../../fixtures/activitiesApi/rollout.json'
import PrisonerAllocationsDashboardPage from '../../../pages/activities/prisonerAllocations/PrisonerAllocationsDashboardPage'
import NonAssociationsPage from '../../../pages/activities/prisonerAllocations/NonAssociationsPage'
import Page from '../../../pages/page'
import RequestDatePage from '../../../pages/activities/waitlist/requestDatePage'
import { WaitingListApplicationPaged } from '../../../../server/@types/activitiesAPI/types'

const prisonCode = 'MDI'

context('Prisoner Allocations Page', () => {
  beforeEach(() => {
    // Reset all mocks and sign in
    cy.task('reset')
    cy.task('stubSignIn')

    // activity data
    const getActivity2 = { ...getActivity, id: 2 }
    const getActivity45 = { ...getActivity, id: 45 }

    // waitlist applications data
    const mockWaitlistApplications = [
      {
        id: 1,
        activityId: 539,
        scheduleId: 1,
        allocationId: null,
        prisonerNumber: 'G0995GW',
        status: 'DECLINED',
        requestedDate: '2025-06-24',
        requestedBy: 'PRISONER',
        activity: {
          id: 539,
          activityName: 'Maths level 1',
          category: {
            id: 1,
            code: 'EDU',
            name: 'Education',
          },
          activityState: 'LIVE',
        },
      },
      {
        id: 2,
        activityId: 2,
        scheduleId: 2,
        allocationId: null,
        prisonerNumber: 'G0995GW',
        status: 'APPROVED',
        requestedDate: '2025-04-01',
        requestedBy: 'STAFF',
        activity: {
          id: 2,
          activityName: 'English level 1',
          category: {
            id: 1,
            code: 'EDU',
            name: 'Education',
          },
          activityState: 'LIVE',
        },
      },
    ]

    const mockWaitingListSearchResults = {
      content: mockWaitlistApplications,
      totalPages: 1,
      pageNumber: 0,
      totalElements: 1,
      first: true,
      last: false,
    } as unknown as WaitingListApplicationPaged

    // Stub backend endpoints required
    cy.stubEndpoint('GET', '/prisoner/G0995GW', prisonerDetails)
    cy.stubEndpoint('GET', '/prisoner/G0995GW/non-associations', prisonerNonAssociations)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations)
    cy.stubEndpoint('GET', '/activities/prisoner-allocations/G0995GW', prisonerAllocations)
    cy.stubEndpoint('GET', `/prison/${prisonCode}/activities\\?excludeArchived=false`, getActivities)
    cy.stubEndpoint('GET', '/rollout/MDI', rolloutPlan)
    cy.stubEndpoint('GET', '/activities/2/filtered', getActivity2)
    cy.stubEndpoint('GET', '/activities/45/filtered', getActivity45)
    cy.stubEndpoint('POST', '/waiting-list-applications/MDI/search', mockWaitingListSearchResults)
    cy.task('stubOffenderImage')
    cy.signIn()
  })

  it('Should display prisoner allocations page correctly', () => {
    cy.visit('/activities/prisoner-allocations/G0995GW')
    const prisonerAllocationsPage = Page.verifyOnPage(PrisonerAllocationsDashboardPage)

    const expectedDetails = [
      { label: 'Location', value: 'A-N-3-30N' },
      { label: 'Incentive level', value: 'Standard' },
      { label: 'Earliest release date', value: '30 November 2019' },
      { label: 'Workplace risk assessment', value: 'None' },
    ]
    const linkLabels = ['Location', 'Incentive level', 'Earliest release date']
    prisonerAllocationsPage.getPrisonerName('Aeticake Potta').should('be.visible')
    prisonerAllocationsPage.verifyMiniProfileDetails(expectedDetails)
    prisonerAllocationsPage.verifyMiniProfileLinks(linkLabels)
    prisonerAllocationsPage.getLinkByText('Allocate to an activity').should('be.visible')
    prisonerAllocationsPage.getLinkByText('Suspend all allocations').should('be.visible')
    prisonerAllocationsPage.getLinkByText("Aeticake Potta's schedule (opens in new tab)").should('be.visible')
  })

  it('Should display prisoner waitlist tab correctly', () => {
    cy.visit('/activities/prisoner-allocations/G0995GW')
    const prisonerAllocationsPage = Page.verifyOnPage(PrisonerAllocationsDashboardPage)

    const expectedDetails = [
      { label: 'Location', value: 'A-N-3-30N' },
      { label: 'Incentive level', value: 'Standard' },
      { label: 'Earliest release date', value: '30 November 2019' },
      { label: 'Workplace risk assessment', value: 'None' },
    ]
    const linkLabels = ['Location', 'Incentive level', 'Earliest release date']
    prisonerAllocationsPage.getPrisonerName('Aeticake Potta').should('be.visible')
    prisonerAllocationsPage.verifyMiniProfileDetails(expectedDetails)
    prisonerAllocationsPage.verifyMiniProfileLinks(linkLabels)
    prisonerAllocationsPage.getLinkByText('Waitlists and Applications').click()
    prisonerAllocationsPage.rows('approved-applications').should('have.length', 1)
    prisonerAllocationsPage.checkTableCell('approved-applications', 0, 'English level 1')
    cy.get('#pendingApplications').contains('reviewed or are still pending')
    prisonerAllocationsPage.rows('rejected-applications').should('have.length', 1)
    prisonerAllocationsPage.checkTableCell('rejected-applications', 0, 'Maths level 1')
    prisonerAllocationsPage.getLinkByText('Log an activity application').should('be.visible').click()
    Page.verifyOnPage(RequestDatePage)
  })

  it('Should display non-associations page correctly', () => {
    cy.visit('/activities/prisoner-allocations/G0995GW')

    const prisonerAllocationsPage = Page.verifyOnPage(PrisonerAllocationsDashboardPage)
    prisonerAllocationsPage
      .getLinkByText("View Aeticake Potta's open non-associations")
      .invoke('removeAttr', 'target')
      .click()

    const nonAssociationsPage = Page.verifyOnPage(NonAssociationsPage)

    // Assertions on mini-profile
    const expectedDetails = [
      { label: 'Location', value: 'A-N-3-30N' },
      { label: 'Incentive level', value: 'Standard' },
      { label: 'Earliest release date', value: '30 November 2019' },
      { label: 'Workplace risk assessment', value: 'None' },
    ]
    // Assertions for links on the profile
    const linkLabels = ['Location', 'Incentive level', 'Earliest release date']

    // Assertions for non associations
    nonAssociationsPage.getPrisonerName('Aeticake Potta').should('be.visible')
    nonAssociationsPage.verifyMiniProfileDetails(expectedDetails)
    nonAssociationsPage.verifyMiniProfileLinks(linkLabels)

    const expectedNonAssociationDetails = {
      name: 'Test, Cypress',
      cellLocation: 'E-S-1-004',
      allocations: ['Workshop - Woodwork', 'Education - R1', 'Library Access', 'Education - R1'],
      nonAssocDetails: ['Reason: Gang related', 'Comments:', 'Aeticake Potta’s role:'],
      lastUpdated: '30 October 2024',
    }

    nonAssociationsPage.verifyNonassociationDetails('G6123VU', expectedNonAssociationDetails)
  })
})
