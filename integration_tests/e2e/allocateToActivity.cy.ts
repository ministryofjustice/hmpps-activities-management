import getActivities from '../fixtures/activitiesApi/getActivities.json'
import getActivityCapacity from '../fixtures/activitiesApi/getActivityCapacity.json'
import getSchedulesInActivity from '../fixtures/activitiesApi/getSchedulesInActivity.json'
import getScheduleCapacity from '../fixtures/activitiesApi/getScheduleCapacity.json'
import getAllocations from '../fixtures/activitiesApi/getAllocations.json'
import inmateDetails from '../fixtures/prisonerSearchApi/prisonerSearchG4793VF.json'
import prisonerAllocations from '../fixtures/activitiesApi/prisonerAllocations.json'
import prisonerEducationLevels from '../fixtures/prisonApi/prisonerEducationLevels.json'
import getSchedule from '../fixtures/activitiesApi/getSchedule.json'
import moorlandIncentiveLevels from '../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import inmateDetailList from '../fixtures/prisonApi/inmateDetailList.json'
import getAllInmatesPerPrison from '../fixtures/prisonerSearchApi/getAllInmatesPerPrison.json'
import getInmateDetails from '../fixtures/prisonApi/getInmateDetails.json'
import getPrisonerIepSummary from '../fixtures/incentivesApi/getPrisonerIepSummary.json'
import getActivity from '../fixtures/activitiesApi/getActivity.json'
import getMdiPrisonPayBands from '../fixtures/activitiesApi/getMdiPrisonPayBands.json'

import IndexPage from '../pages/index'
import Page from '../pages/page'
import ActivitiesDashboardPage from '../pages/allocateToActivity/activitiesDashboard'
import PayBandPage from '../pages/allocateToActivity/payBand'
import CheckAnswersPage from '../pages/allocateToActivity/checkAnswers'
import CancelPage from '../pages/allocateToActivity/cancel'
import ConfirmationPage from '../pages/allocateToActivity/confirmation'
import AllocationDashboard from '../pages/allocateToActivity/AllocationDashboard'

context('Allocate to activity', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')
    cy.stubEndpoint('GET', '/prison/MDI/activities', getActivities)
    cy.stubEndpoint('GET', '/activities/(\\d)*/capacity', getActivityCapacity)
    cy.stubEndpoint('GET', '/activities/(\\d)*/schedules', getSchedulesInActivity)
    cy.stubEndpoint('GET', '/schedules/(\\d)*/capacity', getScheduleCapacity)
    cy.stubEndpoint('GET', '/schedules/5', getSchedule)
    cy.stubEndpoint('GET', '/iep/levels/MDI', moorlandIncentiveLevels)
    cy.stubEndpoint('GET', '/schedules/5/allocations', getAllocations)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', inmateDetails)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations)
    cy.stubEndpoint('POST', '/api/education/prisoners', prisonerEducationLevels)
    cy.stubEndpoint('POST', '/api/bookings/offenders', inmateDetailList)
    cy.stubEndpoint('GET', '/prison/MDI/prisoners\\?page=0&size=20', getAllInmatesPerPrison)
    cy.stubEndpoint('GET', '/api/offenders/A5015DY', getInmateDetails)
    cy.stubEndpoint('GET', '/iep/reviews/prisoner/A5015DY', getPrisonerIepSummary)
    cy.stubEndpoint('GET', '/activities/2', getActivity)
    cy.stubEndpoint('GET', '/prison/MDI/prison-pay-bands', getMdiPrisonPayBands)
    cy.stubEndpoint('POST', '/schedules/5/allocations')
    cy.signIn()
  })

  it('should click through allocate to activity journey', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.allocateToActivityCard().should('contain.text', 'Allocate an inmate to an activity schedule.')
    indexPage.allocateToActivityCard().click()

    const activitiesPage = Page.verifyOnPage(ActivitiesDashboardPage)
    activitiesPage.activityRows().should('have.length', 3)
    activitiesPage.selectActivityWithName('English level 1')

    const allocatePage = Page.verifyOnPage(AllocationDashboard)
    allocatePage.allocatedPeopleRows().should('have.length', 1)
    allocatePage.tabWithTitle('Entry level English 1 schedule').click()
    allocatePage.activeTimeSlots().should('have.length', 1)

    allocatePage.tabWithTitle('Candidates').click()
    allocatePage.selectRiskLevelOption('Any Workplace Risk Assessment')
    allocatePage.applyFilters()
    allocatePage.candidateRows().should('have.length', 10)
    allocatePage.enterCandidateQuery('alfonso')
    allocatePage.search()
    allocatePage.candidateRows().should('have.length', 1)
    allocatePage.selectCandidateWithName('Alfonso Cholak')

    const payBandPage = Page.verifyOnPage(PayBandPage)
    payBandPage.selectPayBand('Medium (£1.75)')
    payBandPage.confirmPayAndContinue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.cancel()

    const cancelPage = Page.verifyOnPage(CancelPage)
    cancelPage.selectOption('No')
    cancelPage.confirm()

    const checkAnswersPage2 = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage2.confirmAllocation()

    Page.verifyOnPage(ConfirmationPage)
  })
})
