import getCategories from '../fixtures/activitiesApi/getCategories.json'
import getCategoryCapacity from '../fixtures/activitiesApi/getCategoryCapacity.json'
import getActivitiesInCategory from '../fixtures/activitiesApi/getActivitiesInCategory.json'
import getActivityCapacity from '../fixtures/activitiesApi/getActivityCapacity.json'
import getSchedulesInActivity from '../fixtures/activitiesApi/getSchedulesInActivity.json'
import getScheduleCapacity from '../fixtures/activitiesApi/getScheduleCapacity.json'
import getAllocations from '../fixtures/activitiesApi/getAllocations.json'
import prisonerAllocations from '../fixtures/activitiesApi/prisonerAllocations.json'
import getSchedule from '../fixtures/activitiesApi/getSchedule.json'
import inmateDetailList from '../fixtures/prisonApi/inmateDetailList.json'
import getAllInmatesPerPrison from '../fixtures/prisonerSearchApi/getAllInmatesPerPrison.json'
import getInmateDetails from '../fixtures/prisonApi/getInmateDetails.json'
import getPrisonerIepSummary from '../fixtures/incentivesApi/getPrisonerIepSummary.json'
import getActivity from '../fixtures/activitiesApi/getActivity.json'

import IndexPage from '../pages/index'
import Page from '../pages/page'
import CategoriesDashboardPage from '../pages/allocateToActivity/categoriesDashboard'
import ActivitiesDashboardPage from '../pages/allocateToActivity/activitiesDashboard'
import SchedulesDashboardPage from '../pages/allocateToActivity/schedulesDashboard'
import PeopleAllocatedNowTabPage from '../pages/allocateToActivity/peopleAllocatedNowTab'
import ScheduleTabPage from '../pages/allocateToActivity/scheduleTab'
import IdentifyCandidatesTabPage from '../pages/allocateToActivity/identifyCandidatesTab'
import PayBandPage from '../pages/allocateToActivity/payBand'
import CheckAnswersPage from '../pages/allocateToActivity/checkAnswers'
import CancelPage from '../pages/allocateToActivity/cancel'
import ConfirmationPage from '../pages/allocateToActivity/confirmation'

context('Change location', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')
    cy.stubEndpoint('GET', '/activity-categories', getCategories)
    cy.stubEndpoint('GET', '/prison/MDI/activity-categories/(\\d)*/capacity', getCategoryCapacity)
    cy.stubEndpoint('GET', '/prison/MDI/activity-categories/(\\d)*/capacity', getCategoryCapacity)
    cy.stubEndpoint('GET', '/prison/MDI/activity-categories/1/activities', getActivitiesInCategory)
    cy.stubEndpoint('GET', '/activities/(\\d)*/capacity', getActivityCapacity)
    cy.stubEndpoint('GET', '/activities/2/schedules', getSchedulesInActivity)
    cy.stubEndpoint('GET', '/schedules/(\\d)*/capacity', getScheduleCapacity)
    cy.stubEndpoint('GET', '/schedules/5/allocations', getAllocations)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations)
    cy.stubEndpoint('GET', '/schedules/5', getSchedule)
    cy.stubEndpoint('POST', '/api/bookings/offenders', inmateDetailList)
    cy.stubEndpoint(
      'GET',
      '/prisoner-search/prison/MDI\\?page=0&size=1000&include-restricted-patients=false',
      getAllInmatesPerPrison,
    )
    cy.stubEndpoint('GET', '/api/offenders/A7742DY', getInmateDetails)
    cy.stubEndpoint('GET', '/iep/reviews/prisoner/A7742DY', getPrisonerIepSummary)
    cy.stubEndpoint('GET', '/activities/2', getActivity)
    cy.stubEndpoint('POST', '/schedules/5/allocations')
    cy.signIn()
  })

  it('should click through allocate to activity journey', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.allocateToActivityCard().should('contain.text', 'Allocate an inmate to an activity schedule.')
    indexPage.allocateToActivityCard().click()

    const categoriesPage = Page.verifyOnPage(CategoriesDashboardPage)
    categoriesPage.categoryRows().should('have.length', 4)
    categoriesPage.selectCategoryWithName('Education')

    const activitiesPage = Page.verifyOnPage(ActivitiesDashboardPage)
    activitiesPage.activityRows().should('have.length', 2)
    activitiesPage.selectActivityWithName('English level 1')

    const schedulesPage = Page.verifyOnPage(SchedulesDashboardPage)
    schedulesPage.scheduleRows().should('have.length', 4)
    schedulesPage.selectScheduleWithName('Entry level English 1')

    const peopleAllocatedNowTab = Page.verifyOnPage(PeopleAllocatedNowTabPage)
    peopleAllocatedNowTab.allocatedPeopleRows().should('have.length', 1)
    peopleAllocatedNowTab.tabWithTitle('Entry level English 1 schedule').click()

    const scheduleTab = Page.verifyOnPage(ScheduleTabPage)
    scheduleTab.tabWithTitle('Identify candidates').click()

    const identifyCandidatesTab = Page.verifyOnPage(IdentifyCandidatesTabPage)
    identifyCandidatesTab.candidateRows().should('have.length', 10)
    identifyCandidatesTab.selectCandidateWithName('Bieber, Justin')

    const payBandPage = Page.verifyOnPage(PayBandPage)
    payBandPage.selectPayBand('B (£2.50)')
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
