import { addMonths, subWeeks } from 'date-fns'
import getActivities from '../../../fixtures/activitiesApi/getActivities.json'
import getSchedulesInActivity from '../../../fixtures/activitiesApi/getSchedulesInActivity.json'
import getAllocations from '../../../fixtures/activitiesApi/getAllocations.json'
import prisonerAllocations from '../../../fixtures/activitiesApi/prisonerAllocations.json'
import moorlandIncentiveLevels from '../../../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import getCandidates from '../../../fixtures/activitiesApi/getCandidates.json'
import getCandidateSuitability from '../../../fixtures/activitiesApi/getCandidateSuitability.json'
import getNonAssociations from '../../../fixtures/activitiesApi/non_associations.json'
import IndexPage from '../../../pages'
import Page from '../../../pages/page'
import ActivitiesDashboardPage from '../../../pages/allocateToActivity/activitiesDashboard'
import AllocationDashboard from '../../../pages/allocateToActivity/allocationDashboard'
import SetUpPrisonerListMethodPage from '../../../pages/allocateToActivity/setUpPrisonerListMethod'
import ManageActivitiesDashboardPage from '../../../pages/activities/manageActivitiesDashboard'
import ActivitiesIndexPage from '../../../pages/activities'
import resetActivityAndScheduleStubs from './allocationsStubHelper'
import HowToAddOptions from '../../../../server/enum/allocations'
import prisonersOnChosenActivity from '../../../fixtures/prisonerSearchApi/getPrisoner-MDI-G4793VF.json'
import ActivityRequirementsReviewPage from '../../../pages/allocateToActivity/activityRequirementsReview'
import StartDatePage from '../../../pages/allocateToActivity/startDate'
import EndDateOptionPage from '../../../pages/allocateToActivity/endDateOption'
import EndDatePage from '../../../pages/allocateToActivity/endDate'
import CheckAndConfirmMultiplePage from '../../../pages/allocateToActivity/checkAndConfirmMultiple'
import ConfirmMultipleAllocationsPage from '../../../pages/allocateToActivity/confirmationMultiple'
import SearchForActivityPage from '../../../pages/allocateToActivity/activitySearch'
import ReviewUploadPrisonerListPage from '../../../pages/allocateToActivity/reviewUploadPrisoner'

context('Allocate multiple people to an activity by copying from another activity', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')

    cy.stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=true', getActivities)
    cy.stubEndpoint('GET', '/activities/(\\d)*/schedules', getSchedulesInActivity)
    cy.stubEndpoint('GET', '/schedules/2/suitability\\?prisonerNumber=A5015DY', getCandidateSuitability)
    cy.stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels)
    cy.stubEndpoint('GET', '/schedules/2/allocations\\?activeOnly=true&includePrisonerSummary=true', getAllocations)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations)
    cy.stubEndpoint('GET', '/schedules/2/waiting-list-applications', JSON.parse('[]'))
    cy.stubEndpoint('GET', '/schedules/2/candidates(.)*', getCandidates)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', prisonersOnChosenActivity.content)
    cy.stubEndpoint('GET', '/prison/MDI/prisoners\\?term=&size=50', prisonersOnChosenActivity)
    cy.stubEndpoint('POST', '/non-associations/involving\\?prisonId=MDI', getNonAssociations)
    cy.stubEndpoint('GET', '/schedules/2/allocations\\?includePrisonerSummary=true', [])
    cy.stubEndpoint('GET', '/schedules/2/suitability\\?prisonerNumber=G4793VF', getCandidateSuitability)
    cy.stubEndpoint('POST', '/schedules/2/allocations')

    resetActivityAndScheduleStubs({ activityStartDate: subWeeks(new Date(), 2), reducedPayOptions: true })
    resetActivityAndScheduleStubs({
      activityStartDate: subWeeks(new Date(), 2),
      subject: 'maths',
      reducedPayOptions: true,
    })

    cy.signIn()
  })

  it('should be able to allocate when selecting an existing activity', () => {
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
    allocatePage.tabWithTitle('Other people').click()
    allocatePage.allocateGroupLink()

    const setUpPrisonerListMethodPage = Page.verifyOnPage(SetUpPrisonerListMethodPage)
    setUpPrisonerListMethodPage.selectHowToAddDecisionRadio(HowToAddOptions.EXISTING_LIST)
    setUpPrisonerListMethodPage.getButton('Continue').click()

    const searchForActivityPage = Page.verifyOnPage(SearchForActivityPage)
    searchForActivityPage.searchBox().type('Maths level 1')
    searchForActivityPage.getButton('Continue').click()

    const reviewUploadPrisonerListPage = Page.verifyOnPage(ReviewUploadPrisonerListPage)
    reviewUploadPrisonerListPage.caption().should('contain.text', 'Entry level English 1')
    reviewUploadPrisonerListPage.rows('inmate-list').should('have.length', 1)
    reviewUploadPrisonerListPage.continue()

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

    const checkAndConfirmMultiple = Page.verifyOnPage(CheckAndConfirmMultiplePage)
    checkAndConfirmMultiple.inmatePayRows().should('have.length', 1)
    checkAndConfirmMultiple.checkTableCell(0, 'Ramroop, Robert Bob')
    checkAndConfirmMultiple.checkTableCell(1, 'Standard incentive level:\nLow - £1.50')
    checkAndConfirmMultiple.checkTableCell(2, '')
    checkAndConfirmMultiple.selectConfirm('Confirm allocation').click()

    const confirmMultipleAllocationsPage = Page.verifyOnPage(ConfirmMultipleAllocationsPage)
    confirmMultipleAllocationsPage.panelHeader().should('contain.text', 'Allocations complete')
    confirmMultipleAllocationsPage
      .panelText()
      .should('contain.text', 'Robert Ramroop is now allocated to Entry level English 1')
  })
})
