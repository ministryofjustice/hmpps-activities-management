import { addMonths, subWeeks } from 'date-fns'
import getActivities from '../../../fixtures/activitiesApi/getActivities.json'
import getSchedulesInActivity from '../../../fixtures/activitiesApi/getSchedulesInActivity.json'
import getAllocations from '../../../fixtures/activitiesApi/getAllocations.json'
import prisonerAllocations from '../../../fixtures/activitiesApi/prisonerAllocations.json'
import moorlandIncentiveLevels from '../../../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import getInmateDetails from '../../../fixtures/prisonerSearchApi/getPrisoner-MDI-A5015DY.json'
import getPrisonerIepSummary from '../../../fixtures/incentivesApi/getPrisonerIepSummary.json'
import getDeallocationReasons from '../../../fixtures/activitiesApi/getDeallocationReasons.json'
import getMdiPrisonPayBands from '../../../fixtures/activitiesApi/getMdiPrisonPayBands.json'
import getCandidates from '../../../fixtures/activitiesApi/getCandidates.json'
import getCandidateSuitability from '../../../fixtures/activitiesApi/getCandidateSuitability.json'
import getNonAssociations from '../../../fixtures/activitiesApi/non_associations.json'

import IndexPage from '../../../pages'
import Page from '../../../pages/page'
import StartDatePage from '../../../pages/allocateToActivity/startDate'
import EndDateOptionPage from '../../../pages/allocateToActivity/endDateOption'
import EndDatePage from '../../../pages/allocateToActivity/endDate'
import ActivitiesDashboardPage from '../../../pages/allocateToActivity/activitiesDashboard'
import PayBandPage from '../../../pages/allocateToActivity/payBand'
import CheckAnswersPage from '../../../pages/allocateToActivity/checkAnswers'
import CancelPage from '../../../pages/allocateToActivity/cancel'
import ConfirmationPage from '../../../pages/allocateToActivity/confirmation'
import AllocationDashboard from '../../../pages/allocateToActivity/allocationDashboard'
import ManageActivitiesDashboardPage from '../../../pages/activities/manageActivitiesDashboard'
import BeforeYouAllocate from '../../../pages/allocateToActivity/beforeYouAllocate'
import ActivitiesIndexPage from '../../../pages/activities'
import ExclusionsPage from '../../../pages/allocateToActivity/exclusions'
import resetActivityAndScheduleStubs from './allocationsStubHelper'

context('Allocate to activity', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=true', getActivities)
    cy.stubEndpoint('GET', '/activities/(\\d)*/schedules', getSchedulesInActivity)
    cy.stubEndpoint('GET', '/schedules/2/suitability\\?prisonerNumber=A5015DY', getCandidateSuitability)
    cy.stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels)
    cy.stubEndpoint('GET', '/schedules/2/allocations\\?activeOnly=true&includePrisonerSummary=true', getAllocations)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations)
    cy.stubEndpoint('GET', '/schedules/2/waiting-list-applications', JSON.parse('[]'))
    cy.stubEndpoint('GET', '/schedules/2/candidates(.)*', getCandidates)
    cy.stubEndpoint('GET', '/prisoner/A5015DY', getInmateDetails)
    cy.stubEndpoint('GET', '/incentive-reviews/prisoner/A5015DY', getPrisonerIepSummary)
    cy.stubEndpoint('GET', '/allocations/deallocation-reasons', getDeallocationReasons)
    cy.stubEndpoint('GET', '/prison/MDI/prison-pay-bands', getMdiPrisonPayBands)
    cy.stubEndpoint('POST', '/schedules/2/allocations')
    cy.stubEndpoint('GET', '/schedules/2/non-associations\\?prisonerNumber=A5015DY', getNonAssociations)

    resetActivityAndScheduleStubs(subWeeks(new Date(), 2))

    cy.signIn()
  })

  it('should be able to allocate when selecting a specific start date', () => {
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
    allocatePage.allocatedPeopleRows().should('have.length', 2)
    allocatePage.nonAssociationsLink('G4793VF').contains('View non-associations')
    allocatePage.nonAssociationsLink('A1351DZ').should('not.exist')
    allocatePage.tabWithTitle('Entry level English 1 schedule').click()
    allocatePage.activeTimeSlots().should('have.length', 1)

    allocatePage.tabWithTitle('Other people').click()
    allocatePage.selectRiskLevelOption('Any Workplace Risk Assessment')
    allocatePage.applyFilters()
    allocatePage.candidateRows().should('have.length', 10)
    allocatePage.nonAssociationsLink('A5015DY').contains('View non-associations')
    allocatePage.selectCandidateWithName('Alfonso Cholak')

    const beforeYouAllocatePage = Page.verifyOnPage(BeforeYouAllocate)
    beforeYouAllocatePage.selectConfirmationRadio('yes')
    beforeYouAllocatePage
      .nonAssociationsCountPara()
      .contains(
        'Review Alfonso Cholak’s 2 open non-associations in Moorland to check that they can be safely allocated.',
      )
    beforeYouAllocatePage.nonAssociationsLink().contains('View Alfonso Cholak’s non-associations')
    beforeYouAllocatePage.getButton('Continue').click()

    const startDatePage = Page.verifyOnPage(StartDatePage)
    startDatePage.selectADifferentDate()
    const startDate = addMonths(new Date(), 1)
    startDatePage.selectDatePickerDate(startDate)
    startDatePage.continue()

    const endDateOptionPage = Page.verifyOnPage(EndDateOptionPage)
    endDateOptionPage.addEndDate('Yes')
    endDateOptionPage.continue()

    const endDatePage = Page.verifyOnPage(EndDatePage)
    const endDate = addMonths(new Date(), 8)
    endDatePage.selectDatePickerDate(endDate)
    endDatePage.continue()

    const payBandPage = Page.verifyOnPage(PayBandPage)
    payBandPage.selectPayBand('Medium - £1.75')
    payBandPage.continue()

    const exclusionsPage = Page.verifyOnPage(ExclusionsPage)
    exclusionsPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.cancel()

    const cancelPage = Page.verifyOnPage(CancelPage)
    cancelPage.selectOption('No')
    cancelPage.confirm()

    const checkAnswersPage2 = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage2.confirmAllocation()

    Page.verifyOnPage(ConfirmationPage)
  })

  it('should be able to allocate when selecting a specific start date', () => {
    cy.stubEndpoint('GET', '/schedules/2/non-associations\\?prisonerNumber=A5015DY', [])
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
    allocatePage.allocatedPeopleRows().should('have.length', 2)
    allocatePage.tabWithTitle('Entry level English 1 schedule').click()
    allocatePage.activeTimeSlots().should('have.length', 1)

    allocatePage.tabWithTitle('Other people').click()
    allocatePage.selectRiskLevelOption('Any Workplace Risk Assessment')
    allocatePage.applyFilters()
    allocatePage.candidateRows().should('have.length', 10)
    allocatePage.selectCandidateWithName('Alfonso Cholak')

    const beforeYouAllocatePage = Page.verifyOnPage(BeforeYouAllocate)
    beforeYouAllocatePage.selectConfirmationRadio('yes')
    beforeYouAllocatePage.nonAssociationsCountPara().should('not.exist')
    beforeYouAllocatePage.nonAssociationsLink().should('not.exist')
    beforeYouAllocatePage
      .noNonAssociationsPara()
      .contains('Alfonso Cholak has no open non-associations with anyone in Moorland')
    beforeYouAllocatePage.getButton('Continue').click()

    const startDatePage = Page.verifyOnPage(StartDatePage)
    startDatePage.selectNextSession()
    startDatePage.continue()

    const endDateOptionPage = Page.verifyOnPage(EndDateOptionPage)
    endDateOptionPage.addEndDate('Yes')
    endDateOptionPage.continue()

    const endDatePage = Page.verifyOnPage(EndDatePage)
    const endDate = addMonths(new Date(), 8)
    endDatePage.selectDatePickerDate(endDate)
    endDatePage.continue()

    const payBandPage = Page.verifyOnPage(PayBandPage)
    payBandPage.selectPayBand('Medium - £1.75')
    payBandPage.continue()

    const exclusionsPage = Page.verifyOnPage(ExclusionsPage)
    exclusionsPage.continue()

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
