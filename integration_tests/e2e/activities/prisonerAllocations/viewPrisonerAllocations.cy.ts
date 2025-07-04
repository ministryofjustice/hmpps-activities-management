import prisonerAllocations from '../../../fixtures/prisonerAllocations/getPrisonerAllocations-60995GW.json'
import prisonerDetails from '../../../fixtures/prisonerSearchApi/getPrisonerDetails-G0995GW.json'
import prisonerNonAssociations from '../../../fixtures/nonAssociationsApi/getNonAssociations-G0995GW.json'
import getActivity from '../../../fixtures/activitiesApi/getActivity.json'
import rolloutPlan from '../../../fixtures/activitiesApi/rollout.json'
import PrisonerAllocationsDashboardPage from '../../../pages/activities/prisonerAllocations/PrisonerAllocationsDashboardPage'
import NonAssociationsPage from '../../../pages/activities/prisonerAllocations/NonAssociationsPage'
import Page from '../../../pages/page'

context('Waitlist - Prisoner Allocations Page', () => {
  beforeEach(() => {
    // Reset all mocks and sign in
    cy.task('reset')
    cy.task('stubSignIn')

    // activity data
    const getActivity2 = { ...getActivity, id: 2 }
    const getActivity45 = { ...getActivity, id: 45 }

    // Stub backend endpoints required
    cy.stubEndpoint('GET', '/prisoner/G0995GW', prisonerDetails)
    cy.stubEndpoint('GET', '/prisoner/G0995GW/non-associations', prisonerNonAssociations)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations)
    cy.stubEndpoint('GET', '/activities/prisoner-allocations/G0995GW', prisonerAllocations)
    cy.stubEndpoint('GET', '/rollout/MDI', rolloutPlan)
    cy.stubEndpoint('GET', '/activities/2/filtered', getActivity2)
    cy.stubEndpoint('GET', '/activities/45/filtered', getActivity45)
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
    prisonerAllocationsPage.getLinkByText('Aeticake Potta schedule(opens in new tab)').should('be.visible')
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
