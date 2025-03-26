import { addMonths, subWeeks } from 'date-fns'
import getActivities from '../../../fixtures/activitiesApi/getActivities.json'
import getSchedulesInActivity from '../../../fixtures/activitiesApi/getSchedulesInActivity.json'
import getAllocations from '../../../fixtures/activitiesApi/getAllocations.json'
import prisonerAllocations from '../../../fixtures/activitiesApi/prisonerAllocations.json'
import moorlandIncentiveLevels from '../../../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import getPrisonerIepSummary from '../../../fixtures/incentivesApi/getPrisonerIepSummary.json'
import getDeallocationReasons from '../../../fixtures/activitiesApi/getDeallocationReasons.json'
import getMdiPrisonPayBands from '../../../fixtures/activitiesApi/getMdiPrisonPayBands.json'
import getCandidates from '../../../fixtures/activitiesApi/getCandidates.json'
import getCandidateSuitability from '../../../fixtures/activitiesApi/getCandidateSuitability.json'
import getNonAssociations from '../../../fixtures/activitiesApi/non_associations.json'
import IndexPage from '../../../pages'
import Page from '../../../pages/page'
import ActivitiesDashboardPage from '../../../pages/allocateToActivity/activitiesDashboard'
import AllocationDashboard from '../../../pages/allocateToActivity/allocationDashboard'
import SetUpPrisonerListMethodPage from '../../../pages/allocateToActivity/setUpPrisonerListMethod'
import SelectPrisonerPage from '../../../pages/allocateToActivity/selectPrisoner'
import ManageActivitiesDashboardPage from '../../../pages/activities/manageActivitiesDashboard'
import ActivitiesIndexPage from '../../../pages/activities'
import resetActivityAndScheduleStubs from './allocationsStubHelper'
import HowToAddOptions from '../../../../server/enum/allocations'
import getPrisonerA1350DZ from '../../../fixtures/prisonerSearchApi/getPrisoner-MDI-A1350DZ.json'
import getPrisonerA8644DY from '../../../fixtures/prisonerSearchApi/getPrisoner-MDI-A8644DY.json'
import getInmateDetails from '../../../fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A1350DZ-A8644DY.json'
import ActivityRequirementsReviewPage from '../../../pages/allocateToActivity/activityRequirementsReview'
import StartDatePage from '../../../pages/allocateToActivity/startDate'
import EndDateOptionPage from '../../../pages/allocateToActivity/endDateOption'
import EndDatePage from '../../../pages/allocateToActivity/endDate'
import PayBandMultiplePage from '../../../pages/allocateToActivity/payBandMultiple'
import CheckAndConfirmMultiplePage from '../../../pages/allocateToActivity/checkAndConfirmMultiple'

context('Allocate multiple one by one to an activity', () => {
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
    cy.stubEndpoint('GET', '/incentive-reviews/prisoner/A5015DY', getPrisonerIepSummary)
    cy.stubEndpoint('GET', '/allocations/deallocation-reasons', getDeallocationReasons)
    cy.stubEndpoint('GET', '/prison/MDI/prison-pay-bands', getMdiPrisonPayBands)
    cy.stubEndpoint('POST', '/schedules/2/allocations')
    cy.stubEndpoint('GET', '/schedules/2/non-associations\\?prisonerNumber=A5015DY', getNonAssociations)
    cy.stubEndpoint('GET', '/prison/MDI/prisoners\\?term=s&size=50', getInmateDetails)
    cy.stubEndpoint('POST', '/non-associations/involving\\?prisonId=MDI', getNonAssociations)
    cy.stubEndpoint('GET', '/prisoner/A1350DZ', getPrisonerA1350DZ)
    cy.stubEndpoint('GET', '/prisoner/A8644DY', getPrisonerA8644DY)
    cy.stubEndpoint('GET', '/schedules/2/allocations\\?includePrisonerSummary=true', [])
    cy.stubEndpoint('GET', '/schedules/2/suitability\\?prisonerNumber=A1350DZ', getCandidateSuitability)
    cy.stubEndpoint('GET', '/schedules/2/suitability\\?prisonerNumber=A8644DY', getCandidateSuitability)

    resetActivityAndScheduleStubs(subWeeks(new Date(), 2))

    cy.signIn()
  })
  // FIXME page asserts required through the journey
  it('should be able to allocate when selecting multiple inmates', () => {
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
    allocatePage.allocatedPeopleRows().should('have.length', 3)
    allocatePage.nonAssociationsLink('G4793VF').contains('View non-associations')
    allocatePage.nonAssociationsLink('A1351DZ').should('not.exist')
    allocatePage.nonAssociationsLink('B1351RE').contains('View non-associations')
    allocatePage.tabWithTitle('Entry level English 1 schedule').click()
    allocatePage.activeTimeSlots().should('have.length', 1)

    allocatePage.tabWithTitle('Other people').click()
    allocatePage.allocateGroupLink()

    const setUpPrisonerListMethodPage = Page.verifyOnPage(SetUpPrisonerListMethodPage)
    setUpPrisonerListMethodPage.selectHowToAddDecisionRadio(HowToAddOptions.SEARCH)
    setUpPrisonerListMethodPage.getButton('Continue').click()

    const selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.caption().should('contain.text', 'Entry level English 1')
    selectPrisonerPage.enterQuery('s')
    selectPrisonerPage.getButton('Search').click()
    selectPrisonerPage.selectRadio('A1350DZ').click()
    selectPrisonerPage.selectPrisonerAndContinue()

    selectPrisonerPage.addAnotherPersonLink()
    selectPrisonerPage.enterQuery('s')
    selectPrisonerPage.getButton('Search').click()
    selectPrisonerPage.selectRadio('A8644DY').click()
    selectPrisonerPage.selectPrisonerAndContinue()

    selectPrisonerPage.inmateRows().should('have.length', 2)
    selectPrisonerPage.continue()

    const activityRequirementsReviewPage = Page.verifyOnPage(ActivityRequirementsReviewPage)
    activityRequirementsReviewPage.caption().should('contain.text', 'Entry level English 1')
    activityRequirementsReviewPage.continue()

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

    const payBandMultiplePage = Page.verifyOnPage(PayBandMultiplePage)
    payBandMultiplePage.selectPayBand('inmatePayData-0-payBand-2')
    payBandMultiplePage.selectPayBand('inmatePayData-1-payBand-2')
    payBandMultiplePage.continue()

    const checkAndConfirmMultiple = Page.verifyOnPage(CheckAndConfirmMultiplePage)
    checkAndConfirmMultiple.inmatePayRows().should('have.length', 2)
    checkAndConfirmMultiple.selectConfirm('Confirm 2 allocations').click()
  })
})
