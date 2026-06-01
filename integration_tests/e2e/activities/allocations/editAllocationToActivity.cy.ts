import { subWeeks } from 'date-fns'
import getActivities from '../../../fixtures/activitiesApi/getActivities.json'
import getAllocations from '../../../fixtures/activitiesApi/getAllocations.json'
import prisonerAllocations from '../../../fixtures/activitiesApi/prisonerAllocations.json'
import moorlandIncentiveLevels from '../../../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import getInmateDetails from '../../../fixtures/prisonerSearchApi/getPrisoner-MDI-G4793VF.json'
import getPrisonerIepSummary from '../../../fixtures/incentivesApi/getPrisonerIepSummary.json'
import getDeallocationReasons from '../../../fixtures/activitiesApi/getDeallocationReasons.json'
import getMdiPrisonPayBands from '../../../fixtures/activitiesApi/getMdiPrisonPayBands.json'
import getCandidates from '../../../fixtures/activitiesApi/getCandidates.json'
import getNonAssociations from '../../../fixtures/activitiesApi/non_associations.json'
import getMdiPrisonRegime from '../../../fixtures/prisonApi/getMdiPrisonRegime.json'

import IndexPage from '../../../pages'
import Page from '../../../pages/page'
import ActivitiesDashboardPage from '../../../pages/allocateToActivity/activitiesDashboard'
import AllocationDashboard from '../../../pages/allocateToActivity/allocationDashboard'
import ManageActivitiesDashboardPage from '../../../pages/activities/manageActivitiesDashboard'
import ActivitiesIndexPage from '../../../pages/activities'
import resetActivityAndScheduleStubs from './allocationsStubHelper'
import CheckAllocationPage from '../../../pages/allocateToActivity/checkAllocationPage'
import ExclusionsPage from '../../../pages/allocateToActivity/exclusions'
import ConfirmExclusionsPage from '../../../pages/allocateToActivity/confirmExclusionsPage'

const navigateToActivitiesDashboard = (): AllocationDashboard => {
  const indexPage = Page.verifyOnPage(IndexPage)
  indexPage.activitiesCard().click()

  const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
  activitiesIndexPage.allocateToActivitiesCard().click()

  const manageActivitiesPage = Page.verifyOnPage(ManageActivitiesDashboardPage)
  manageActivitiesPage.manageAllocationsCard().click()

  const activitiesPage = Page.verifyOnPage(ActivitiesDashboardPage)
  activitiesPage.selectActivityWithName('English level 1')

  const allocatePage = Page.verifyOnPage(AllocationDashboard)
  return allocatePage
}

context('Allocate to activity', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=true', getActivities)
    cy.stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels)
    cy.stubEndpoint('GET', '/schedules/2/allocations\\?activeOnly=true&includePrisonerSummary=true', getAllocations)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations)
    cy.stubEndpoint(
      'GET',
      '/schedules/2/waiting-list-applications\\?includeNonAssociationsCheck=true',
      JSON.parse('[]'),
    )
    cy.stubEndpoint('GET', '/schedules/2/candidates(.)*', getCandidates)
    cy.stubEndpoint('GET', '/prisoner/G4793VF', getInmateDetails)
    cy.stubEndpoint('GET', '/incentive-reviews/prisoner/G4793VF', getPrisonerIepSummary)
    cy.stubEndpoint('GET', '/allocations/deallocation-reasons', getDeallocationReasons)
    cy.stubEndpoint('GET', '/prison/MDI/prison-pay-bands', getMdiPrisonPayBands)
    cy.stubEndpoint('POST', '/schedules/2/allocations')
    cy.stubEndpoint('GET', '/schedules/2/non-associations\\?prisonerNumber=G4793VF', getNonAssociations)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails)
    cy.stubEndpoint('GET', '/prison/prison-regime/MDI', getMdiPrisonRegime)
    cy.stubEndpoint('GET', '/prison/MDI/prison-pay-bands', getMdiPrisonPayBands)
    cy.stubEndpoint('GET', '/allocations/id/2', {
      ...getAllocations[0],
      activityId: 2,
      scheduleId: 2,
      prisonPayBand: { id: 11 },
      exclusions: [],
      startDate: '2022-10-10',
    })

    resetActivityAndScheduleStubs({ activityStartDate: subWeeks(new Date(), 2) })

    cy.signIn()
  })

  // Note: Cypress only lets us freeze time in the browser.
  // As a result, the same day modifications logic (which run in the node app) can only be covered by the unit tests.
  // TODO: Use commented out assertions when sameDayScheduleModificationsEnabled flag is removed
  it('should be able to edit exclusions without triggering same day modifications logic', () => {
    cy.stubEndpoint('GET', '/schedules/2/non-associations\\?prisonerNumber=A5015DY', [])

    const allocatePage = navigateToActivitiesDashboard()
    allocatePage.allocatedPeopleRows().should('have.length', 3)

    allocatePage.selectAllocatedPrisonerByName('Bloggs, Jo')
    allocatePage.manageAllocationForSelectedPrisoner()

    const checkAllocationPage = Page.verifyOnPage(CheckAllocationPage)
    checkAllocationPage.changeSchedule()

    const exclusionsPage = Page.verifyOnPage(ExclusionsPage)

    exclusionsPage.pageTitle().should('contain.text', `Change when Jo Bloggs should attend this activity`)
    exclusionsPage.detailsSummary().should('not.exist')

    // exclusionsPage.pageTitle().should('contain.text', `Change Jo Bloggs's scheduled sessions for this activity`)
    // exclusionsPage.detailsSummary().should('contain.text', 'Adding sessions for people to attend today')

    cy.get('#week1\\[tuesday\\]').uncheck()
    exclusionsPage.continue()

    const confirmExclusionsPage = Page.verifyOnPage(ConfirmExclusionsPage)

    confirmExclusionsPage
      .pageTitle()
      .should('contain.text', `Check changes to when Jo Bloggs should attend English level 1`)

    confirmExclusionsPage.excludedSessionsValue().should('contain.text', 'Tuesday AM (10:00 to 11:00)')
    confirmExclusionsPage
      .bodyText()
      .should(
        'contain.text',
        'Sessions someone has been modified out of will need to be added back to their schedule before they can attend again.',
      )

    confirmExclusionsPage.changeLink(0).should('exist')
    confirmExclusionsPage.changeLink(1).should('exist').click()

    cy.get('#week1\\[tuesday\\]').check()
    exclusionsPage.continue()

    confirmExclusionsPage.excludedSessionsValue().should('contain.text', 'None')
    confirmExclusionsPage
      .bodyText()
      .should('contain.text', 'You are not making any changes to when Jo Bloggs should attend')

    confirmExclusionsPage.confirm()

    // Check 'confirm' routes us back to the allocations page
    Page.verifyOnPage(CheckAllocationPage)
  })
})
