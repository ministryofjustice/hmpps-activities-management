import { addHours, subWeeks } from 'date-fns'
import IndexPage from '../../../pages'
import Page from '../../../pages/page'
import ActivitiesIndexPage from '../../../pages/activities'
import ManageActivitiesDashboardPage from '../../../pages/activities/manageActivitiesDashboard'
import ActivitiesDashboardPage from '../../../pages/allocateToActivity/activitiesDashboard'
import AllocationDashboard from '../../../pages/allocateToActivity/allocationDashboard'
import BeforeYouAllocate from '../../../pages/allocateToActivity/beforeYouAllocate'
import StartDatePage from '../../../pages/allocateToActivity/startDate'
import EndDateOptionPage from '../../../pages/allocateToActivity/endDateOption'
import PayBandPage from '../../../pages/allocateToActivity/payBand'
import ExclusionsPage from '../../../pages/allocateToActivity/exclusions'
import CheckAnswersPage from '../../../pages/allocateToActivity/checkAnswers'
import ConfirmationPage from '../../../pages/allocateToActivity/confirmation'
// import ConfirmDeallocateExistingPage from '../../../pages/allocateToActivity/confirmDeallocateExistingPage'
import getActivity from '../../../fixtures/activitiesApi/getActivity.json'

import resetActivityAndScheduleStubs from './allocationsStubHelper'
import getActivities from '../../../fixtures/activitiesApi/getActivities.json'
import moorlandIncentiveLevels from '../../../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import getSchedulesInActivity from '../../../fixtures/activitiesApi/getSchedulesInActivity.json'
// import getAllocations from '../../../fixtures/activitiesApi/getAllocations.json'
import prisonerAllocations from '../../../fixtures/activitiesApi/prisonerAllocationsA5015DY.json'
import getCandidates from '../../../fixtures/activitiesApi/getCandidates.json'
import getPrisonerIepSummary from '../../../fixtures/incentivesApi/getPrisonerIepSummary.json'
import getInmateDetails from '../../../fixtures/prisonerSearchApi/getPrisoner-MDI-A5015DY.json'
import getCandidateSuitability from '../../../fixtures/activitiesApi/getCandidateSuitability.json'
import getDeallocationReasons from '../../../fixtures/activitiesApi/getDeallocationReasons.json'
// import SelectActivitiesPage from '../../../pages/allocateToActivity/selectActivityDeallocation'
// import DeallocationDatePage from '../../../pages/allocateToActivity/deallocationDate'
// import getAllocationsMaths from '../../../fixtures/activitiesApi/getAllocationsMaths.json'
// import DeallocationReasonPage from '../../../pages/allocateToActivity/deallocationReason'
// import DeallocationCheckAndConfirmPage from '../../../pages/allocateToActivity/deallocationCheckAndConfirm'
// import { formatDate, toDateString } from '../../../../server/utils/utils'

const allocations1 = [
  {
    id: 2,
    activityId: 2,
    prisonerNumber: 'A5015DY',
    activitySummary: 'Maths level 1',
    scheduleDescription: 'Entry level Maths 1',
    payBand: 'A',
    startDate: '2022-10-10',
    endDate: '2025-08-18',
    allocatedTime: '2022-10-10T09:30:00',
    allocatedBy: 'MR BLOGS',
    deallocatedTime: null,
    deallocatedBy: null,
    deallocatedReason: null,
    prisonerName: 'JO BLOGGS',
    prisonerFirstName: 'JO',
    prisonerLastName: 'BLOGGS',
    cellLocation: '2-1-007',
    releaseDate: '2040-06-23',
    nonAssociations: true,
    plannedDeallocation: {
      id: 2,
      plannedDate: '2025-08-17',
      plannedBy: 'DHOUSTON_GEN',
      plannedReason: {
        code: 'OTHER',
        description: 'Other',
      },
      plannedAt: '2025-08-25T12:07:54.761622',
    },
  },
]
context(' End activity after an allocation', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.stubEndpoint('GET', '/activities/2/filtered', getActivity)
    cy.stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=true', getActivities)
    cy.stubEndpoint('GET', '/activities/(\\d)*/schedules', getSchedulesInActivity)
    cy.stubEndpoint('GET', '/schedules/2/suitability\\?prisonerNumber=A5015DY', getCandidateSuitability)
    cy.stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels)
    cy.stubEndpoint('GET', '/schedules/2/non-associations\\?prisonerNumber=A5015DY', [])
    // cy.stubEndpoint('GET', '/schedules/2/allocations\\?activeOnly=true&includePrisonerSummary=true', getAllocations)
    cy.stubEndpoint('GET', '/schedules/2/allocations\\?activeOnly=true&includePrisonerSummary=true', allocations1)

    cy.stubEndpoint('GET', '/schedules/2/allocations\\?activeOnly=true', allocations1)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations)
    cy.stubEndpoint(
      'GET',
      '/schedules/2/waiting-list-applications\\?includeNonAssociationsCheck=true',
      JSON.parse('[]'),
    )
    cy.stubEndpoint('GET', '/schedules/2/candidates(.)*', getCandidates)
    cy.stubEndpoint('GET', '/prisoner/A5015DY', getInmateDetails)
    cy.stubEndpoint('GET', '/incentive-reviews/prisoner/A5015DY', getPrisonerIepSummary)
    cy.stubEndpoint('GET', '/allocations/deallocation-reasons', getDeallocationReasons)
    cy.stubEndpoint('POST', '/schedules/2/allocations')
    cy.stubEndpoint('GET', '/allocations/id/2', prisonerAllocations[0].allocations[1])
    cy.stubEndpoint('GET', '/allocations/id/1', prisonerAllocations[0].allocations[0])
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails)
    cy.stubEndpoint('PUT', '/schedules/2/deallocate')

    const today = new Date()
    const hours = addHours(today, 2).getHours().toString().padStart(2, '0')
    const mins = today.getMinutes().toString().padStart(2, '0')
    resetActivityAndScheduleStubs({ activityStartDate: subWeeks(today, 2), subject: 'english' })

    resetActivityAndScheduleStubs({ activityStartDate: new Date(), subject: 'maths', startTime: `${hours}:${mins}` })
    resetActivityAndScheduleStubs({ activityStartDate: new Date(), subject: 'science', startTime: `${hours}:${mins}` })

    cy.signIn()
  })

  it('Allocate prisoner to an activity', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.allocateToActivitiesCard().click()

    const manageActivitiesPage = Page.verifyOnPage(ManageActivitiesDashboardPage)
    manageActivitiesPage.allocateToActivityCard().should('contain.text', 'Manage allocations')
    manageActivitiesPage.allocateToActivityCard().click()

    const activitiesPage = Page.verifyOnPage(ActivitiesDashboardPage)
    activitiesPage.activityRows().should('have.length', 3)
    activitiesPage.selectActivityWithName('English level 1')

    const allocatePage = Page.verifyOnPage(AllocationDashboard)
    allocatePage.tabWithTitle('Entry level English 1 schedule').click()

    allocatePage.tabWithTitle('Other people').click()
    allocatePage.selectRiskLevelOption('Any Workplace Risk Assessment')
    allocatePage.applyFilters()
    allocatePage.selectCandidateWithName('Alfonso Cholak')

    const beforeYouAllocatePage = Page.verifyOnPage(BeforeYouAllocate)
    beforeYouAllocatePage.selectConfirmationRadio('yes')
    beforeYouAllocatePage.getButton('Continue').click()

    const startDatePage = Page.verifyOnPage(StartDatePage)
    startDatePage.selectNextSession()
    startDatePage.continue()

    const endDateOptionPage = Page.verifyOnPage(EndDateOptionPage)
    endDateOptionPage.addEndDate('No')
    endDateOptionPage.continue()

    const payBandPage = Page.verifyOnPage(PayBandPage)
    payBandPage.selectPayBand('Medium - £1.75')
    payBandPage.continue()

    const exclusionsPage = Page.verifyOnPage(ExclusionsPage)
    exclusionsPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.confirmAllocation()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.reviewAllocationsLink().click()
    Page.verifyOnPage(AllocationDashboard)
    allocatePage.selectAllocatedPrisonerByName('Bloggs, Jo')
    allocatePage.getButton('End allocation').click()
    // const existingAllocations = Page.verifyOnPage(ConfirmDeallocateExistingPage)
  })
})
