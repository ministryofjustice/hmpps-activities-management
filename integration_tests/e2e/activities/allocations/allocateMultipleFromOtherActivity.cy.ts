import { addMonths, subWeeks } from 'date-fns'
import getActivities from '../../../fixtures/activitiesApi/getActivities.json'
import getSchedulesInActivity from '../../../fixtures/activitiesApi/getSchedulesInActivity.json'
import getAllocations from '../../../fixtures/activitiesApi/getAllocations.json'
import prisonerAllocations from '../../../fixtures/activitiesApi/prisonerAllocations.json'
import moorlandIncentiveLevels from '../../../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import getCandidates from '../../../fixtures/activitiesApi/getCandidates.json'
import getCandidateSuitability from '../../../fixtures/activitiesApi/getCandidateSuitability.json'
import IndexPage from '../../../pages'
import Page from '../../../pages/page'
import ActivitiesDashboardPage from '../../../pages/allocateToActivity/activitiesDashboard'
import AllocationDashboard from '../../../pages/allocateToActivity/allocationDashboard'
import SetUpPrisonerListMethodPage from '../../../pages/allocateToActivity/setUpPrisonerListMethod'
import ManageActivitiesDashboardPage from '../../../pages/activities/manageActivitiesDashboard'
import ActivitiesIndexPage from '../../../pages/activities'
import resetActivityAndScheduleStubs from './allocationsStubHelper'
import HowToAddOptions from '../../../../server/enum/allocations'
import prisonersOnChosenActivity from '../../../fixtures/prisonerSearchApi/getPrisoner-MDI-G4793VF-A1351DZ-B1351RE.json'
import ActivityRequirementsReviewPage from '../../../pages/allocateToActivity/activityRequirementsReview'
import StartDatePage from '../../../pages/allocateToActivity/startDate'
import EndDateOptionPage from '../../../pages/allocateToActivity/endDateOption'
import EndDatePage from '../../../pages/allocateToActivity/endDate'
import CheckAndConfirmMultiplePage from '../../../pages/allocateToActivity/checkAndConfirmMultiple'
import ConfirmMultipleAllocationsPage from '../../../pages/allocateToActivity/confirmationMultiple'
import SearchForActivityPage from '../../../pages/allocateToActivity/activitySearch'
import ReviewUploadPrisonerListPage from '../../../pages/allocateToActivity/reviewUploadPrisoner'
import getNonAssociationsInvolving from '../../../fixtures/nonAssociationsApi/getNonAssociationsInvolving.json'

const getCandidateSuitability2 = { ...getCandidateSuitability }
getCandidateSuitability2.incentiveLevel.incentiveLevel = 'Enhanced 2'

const nonAssociationsPresent = [...getNonAssociationsInvolving]
nonAssociationsPresent[0].firstPrisonerNumber = 'G4793VF'

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
    cy.stubEndpoint('POST', '/non-associations/involving\\?prisonId=MDI', nonAssociationsPresent)

    cy.stubEndpoint('GET', '/schedules/2/suitability\\?prisonerNumber=G4793VF', getCandidateSuitability)
    cy.stubEndpoint('GET', '/schedules/2/suitability\\?prisonerNumber=B1351RE', getCandidateSuitability2)
    cy.stubEndpoint('GET', '/schedules/2/suitability\\?prisonerNumber=A1351DZ', getCandidateSuitability)
    cy.stubEndpoint('POST', '/schedules/2/allocations')

    resetActivityAndScheduleStubs({
      activityStartDate: subWeeks(new Date(), 2),
      reducedPayOptions: true,
      addExtraAllocations: true,
    })
    resetActivityAndScheduleStubs({
      activityStartDate: subWeeks(new Date(), 2),
      subject: 'maths',
      reducedPayOptions: true,
      addExtraAllocations: true,
    })

    cy.signIn()
  })

  it('should be able to allocate when selecting an existing activity - multiple people, some not applicable', () => {
    cy.stubEndpoint('GET', '/schedules/2/allocations\\?includePrisonerSummary=true', [getAllocations[1]])

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
    reviewUploadPrisonerListPage.checkTableCell('inmate-list', 0, 'Ramroop, Robert Bob')
    reviewUploadPrisonerListPage.checkTableCell('inmate-list', 1, '2-2-024')
    reviewUploadPrisonerListPage.checkTableCell('inmate-list', 2, 'View non-associations')
    reviewUploadPrisonerListPage.checkTableCell('inmate-list', 3, 'Maths level 1\nEnglish level 1')
    reviewUploadPrisonerListPage.checkTableCell('inmate-list', 4, 'Remove')
    reviewUploadPrisonerListPage.checkTableCell('incentive-level-list', 0, 'Alfres, Bumahwaju Peter')
    reviewUploadPrisonerListPage.checkTableCell('incentive-level-list', 1, 'Enhanced2')
    reviewUploadPrisonerListPage.rows('incentive-level-list').should('have.length', 1)
    reviewUploadPrisonerListPage.checkTableCell('allocated-inmate-list', 0, 'Somewhere, Some Body')
    reviewUploadPrisonerListPage.checkTableCell('allocated-inmate-list', 1, '10 October 2022')
    reviewUploadPrisonerListPage.rows('allocated-inmate-list').should('have.length', 1)
    reviewUploadPrisonerListPage
      .cannotAllocateTitle()
      .should(
        'contain.text',
        '2 people from A basic maths course suitable for introduction to the subject cannot be allocated to Entry level English 1',
      )
    reviewUploadPrisonerListPage
      .incentiveLevelText()
      .should(
        'contain.text',
        'There is 1 person with an incentive level that does not match a pay rate for this activity',
      )
    reviewUploadPrisonerListPage
      .alreadyAllocatedText()
      .should('contain.text', 'There is 1 person already allocated to Entry level English 1')

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
  it('should block allocation if there are no appropriate people from the selected activity', () => {
    const alreadyAllocated = getAllocations.slice(0, 2)
    cy.stubEndpoint('GET', '/schedules/2/allocations\\?includePrisonerSummary=true', alreadyAllocated)

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
    reviewUploadPrisonerListPage
      .title()
      .should(
        'contain.text',
        'No-one from A basic maths course suitable for introduction to the subject can be allocated',
      )
    reviewUploadPrisonerListPage.cannotAllocateTitle().should('contain.text', 'Why people could not be allocated')
    reviewUploadPrisonerListPage.hasText('Check the list of people you’re using is correct. You may need to:')
    reviewUploadPrisonerListPage.list().should('exist')
    reviewUploadPrisonerListPage.caption().should('contain.text', 'Entry level English 1')
    cy.get(`[data-qa="inmate-list"]`).should('not.exist')
    reviewUploadPrisonerListPage.rows('incentive-level-list').should('have.length', 1)
    reviewUploadPrisonerListPage.checkTableCell('incentive-level-list', 0, 'Alfres, Bumahwaju Peter')
    reviewUploadPrisonerListPage.rows('allocated-inmate-list').should('have.length', 2)
    reviewUploadPrisonerListPage.checkTableCell('allocated-inmate-list', 0, 'Ramroop, Robert Bob')
    reviewUploadPrisonerListPage.checkTableCell('allocated-inmate-list', 2, 'Somewhere, Some Body')
    reviewUploadPrisonerListPage
      .incentiveLevelText()
      .should(
        'contain.text',
        'There is 1 person with an incentive level that does not match a pay rate for this activity',
      )
    reviewUploadPrisonerListPage
      .alreadyAllocatedText()
      .should('contain.text', 'There are 2 people already allocated to Entry level English 1')
    reviewUploadPrisonerListPage.getLinkByText('Return to the activity').should('exist')
  })

  it('should be able to allocate when selecting multiple inmates - unpaid activity', () => {
    cy.stubEndpoint('GET', '/schedules/2/allocations\\?includePrisonerSummary=true', [getAllocations])
    resetActivityAndScheduleStubs({ activityStartDate: subWeeks(new Date(), 2), paid: false })
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
    setUpPrisonerListMethodPage.selectHowToAddDecisionRadio(HowToAddOptions.EXISTING_LIST)
    setUpPrisonerListMethodPage.getButton('Continue').click()

    const searchForActivityPage = Page.verifyOnPage(SearchForActivityPage)
    searchForActivityPage.searchBox().type('Maths level 1')
    searchForActivityPage.getButton('Continue').click()

    const reviewUploadPrisonerListPage = Page.verifyOnPage(ReviewUploadPrisonerListPage)
    reviewUploadPrisonerListPage.caption().should('contain.text', 'Entry level English 1')
    reviewUploadPrisonerListPage.rows('inmate-list').should('have.length', 3)
    reviewUploadPrisonerListPage.checkTableCell('inmate-list', 2, 'None')
    reviewUploadPrisonerListPage.checkTableCell('inmate-list', 7, 'View non-associations')
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
    cy.get(`[data-qa="prisoner-pay-list"]`).should('not.exist')
    checkAndConfirmMultiple.selectConfirm('Confirm 3 allocations').click()

    const confirmMultipleAllocationsPage = Page.verifyOnPage(ConfirmMultipleAllocationsPage)
    confirmMultipleAllocationsPage.panelHeader().should('contain.text', 'Allocations complete')
    confirmMultipleAllocationsPage
      .panelText()
      .should('contain.text', '3 people are now allocated to Entry level English 1')
  })
})
