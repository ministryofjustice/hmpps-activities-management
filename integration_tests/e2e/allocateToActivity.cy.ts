import { addMonths } from 'date-fns'
import getActivities from '../fixtures/activitiesApi/getActivities.json'
import getSchedulesInActivity from '../fixtures/activitiesApi/getSchedulesInActivity.json'
import getAllocations from '../fixtures/activitiesApi/getAllocations.json'
import inmateDetails from '../fixtures/prisonerSearchApi/prisonerSearchG4793VF.json'
import prisonerAllocations from '../fixtures/activitiesApi/prisonerAllocations.json'
import getSchedule from '../fixtures/activitiesApi/getSchedule.json'
import moorlandIncentiveLevels from '../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import getInmateDetails from '../fixtures/prisonApi/getInmateDetails.json'
import getPrisonerIepSummary from '../fixtures/incentivesApi/getPrisonerIepSummary.json'
import getActivity from '../fixtures/activitiesApi/getActivity.json'
import getMdiPrisonPayBands from '../fixtures/activitiesApi/getMdiPrisonPayBands.json'
import getCandidates from '../fixtures/activitiesApi/getCandidates.json'
import getCandidateSuitability from '../fixtures/activitiesApi/getCandidateSuitability.json'

import IndexPage from '../pages/index'
import Page from '../pages/page'
import StartDatePage from '../pages/allocateToActivity/startDate'
import EndDateOptionPage from '../pages/allocateToActivity/endDateOption'
import EndDatePage from '../pages/allocateToActivity/endDate'
import ActivitiesDashboardPage from '../pages/allocateToActivity/activitiesDashboard'
import PayBandPage from '../pages/allocateToActivity/payBand'
import CheckAnswersPage from '../pages/allocateToActivity/checkAnswers'
import CancelPage from '../pages/allocateToActivity/cancel'
import ConfirmationPage from '../pages/allocateToActivity/confirmation'
import AllocationDashboard from '../pages/allocateToActivity/AllocationDashboard'
import ManageActivitiesDashboardPage from '../pages/activities/manageActivitiesDashboard'
import BeforeYouAllocate from '../pages/allocateToActivity/before-you-allocate'

context('Allocate to activity', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')
    cy.stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=true', getActivities)
    cy.stubEndpoint('GET', '/activities/(\\d)*/schedules', getSchedulesInActivity)
    cy.stubEndpoint('GET', '/schedules/2/suitability\\?prisonerNumber=A5015DY', getCandidateSuitability)
    cy.stubEndpoint('GET', '/schedules/2', getSchedule)
    cy.stubEndpoint('GET', '/iep/levels/MDI', moorlandIncentiveLevels)
    cy.stubEndpoint('GET', '/schedules/2/allocations\\?activeOnly=true', getAllocations)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', inmateDetails)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations)
    cy.stubEndpoint('GET', '/schedules/2/candidates(.)*', getCandidates)
    cy.stubEndpoint('GET', '/api/offenders/A5015DY', getInmateDetails)
    cy.stubEndpoint('GET', '/iep/reviews/prisoner/A5015DY', getPrisonerIepSummary)
    cy.stubEndpoint('GET', '/activities/2', getActivity)
    cy.stubEndpoint('GET', '/prison/MDI/prison-pay-bands', getMdiPrisonPayBands)
    cy.stubEndpoint('POST', '/schedules/2/allocations')
    cy.signIn()
  })

  it('should click through allocate to activity journey', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.manageActivitiesAndAllocationsCard().should('contain.text', 'Manage activities and allocations')
    indexPage.manageActivitiesAndAllocationsCard().click()

    const manageActivitiesPage = Page.verifyOnPage(ManageActivitiesDashboardPage)
    manageActivitiesPage.allocateToActivityCard().should('contain.text', 'Manage allocations')
    manageActivitiesPage.allocateToActivityCard().click()

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
    allocatePage.selectCandidateWithName('Alfonso Cholak')

    const beforeYouAllocatePage = Page.verifyOnPage(BeforeYouAllocate)
    beforeYouAllocatePage.selectConfirmationRadio('yes')
    beforeYouAllocatePage.getButton('Confirm').click()

    const startDatePage = Page.verifyOnPage(StartDatePage)
    const startDatePicker = startDatePage.getDatePicker()
    const startDate = addMonths(new Date(), 1)
    startDatePicker.enterDate(startDate)
    startDatePage.saveAndContinue()

    const endDateOptionPage = Page.verifyOnPage(EndDateOptionPage)
    endDateOptionPage.addEndDate('Yes')
    endDateOptionPage.saveAndContinue()

    const endDatePage = Page.verifyOnPage(EndDatePage)
    const endDatePicker = endDatePage.getDatePicker()
    const endDate = addMonths(new Date(), 8)
    endDatePicker.enterDate(endDate)
    endDatePage.saveAndContinue()

    const payBandPage = Page.verifyOnPage(PayBandPage)
    payBandPage.selectPayBand('Medium (£1.75)')
    payBandPage.saveAndContinue()

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
