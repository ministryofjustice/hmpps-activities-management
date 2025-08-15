import prisonerAllocations from '../../../fixtures/prisonerAllocations/getPrisonerAllocations-60995GW.json'
import prisonerDetails from '../../../fixtures/prisonerSearchApi/getPrisonerDetails-G0995GW.json'
import prisonerNonAssociations from '../../../fixtures/nonAssociationsApi/getNonAssociations-G0995GW.json'
import getActivity from '../../../fixtures/activitiesApi/getActivity.json'
import rolloutPlan from '../../../fixtures/activitiesApi/rollout.json'
import PrisonerAllocationsDashboardPage from '../../../pages/activities/prisonerAllocations/PrisonerAllocationsDashboardPage'
import Page from '../../../pages/page'
import { WaitingListApplicationPaged } from '../../../../server/@types/activitiesAPI/types'

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
        id: 213,
        activityId: 539,
        scheduleId: 518,
        allocationId: null,
        prisonCode: 'MDI',
        prisonerNumber: '60995GW2',
        bookingId: 1136879,
        status: 'APPROVED',
        statusUpdatedTime: '2025-07-16T15:20:10',
        requestedDate: '2025-06-24',
        requestedBy: 'PRISONER',
        comments: 'Test',
        declinedReason: null,
        creationTime: '2025-06-24T08:34:22',
        createdBy: 'SCH_ACTIVITY',
        updatedTime: '2025-07-16T15:20:10',
        updatedBy: 'DTHOMAS_GEN',
        earliestReleaseDate: {
          releaseDate: '2018-01-26',
          isTariffDate: false,
          isIndeterminateSentence: false,
          isImmigrationDetainee: false,
          isConvictedUnsentenced: false,
          isRemand: false,
        },
        nonAssociations: false,
        activity: {
          id: 539,
          activityName: 'A Wing Cleaner 2',
          category: {
            id: 3,
            code: 'SAA_PRISON_JOBS',
            name: 'Prison jobs',
            description:
              'Such as kitchen, cleaning, gardens or other maintenance and services to keep the prison running',
          },
          capacity: 8,
          allocated: 4,
          waitlisted: 3,
          createdTime: '2023-10-23T09:59:24',
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
})
