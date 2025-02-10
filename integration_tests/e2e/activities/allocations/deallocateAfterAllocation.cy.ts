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

import resetActivityAndScheduleStubs from './allocationsStubHelper'
import getActivities from '../../../fixtures/activitiesApi/getActivities.json'
import moorlandIncentiveLevels from '../../../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import getSchedulesInActivity from '../../../fixtures/activitiesApi/getSchedulesInActivity.json'
import getAllocations from '../../../fixtures/activitiesApi/getAllocations.json'
import prisonerAllocations from '../../../fixtures/activitiesApi/prisonerAllocationsA5015DY.json'
import getCandidates from '../../../fixtures/activitiesApi/getCandidates.json'
import getPrisonerIepSummary from '../../../fixtures/incentivesApi/getPrisonerIepSummary.json'
import getInmateDetails from '../../../fixtures/prisonerSearchApi/getPrisoner-MDI-A5015DY.json'
import getCandidateSuitability from '../../../fixtures/activitiesApi/getCandidateSuitability.json'
import getDeallocationReasons from '../../../fixtures/activitiesApi/getDeallocationReasons.json'
import SelectActivitiesPage from '../../../pages/allocateToActivity/selectActivityDeallocation'
import DeallocationDatePage from '../../../pages/allocateToActivity/deallocationDate'
import getAllocationsMaths from '../../../fixtures/activitiesApi/getAllocationsMaths.json'
import DeallocationReasonPage from '../../../pages/allocateToActivity/deallocationReason'
import DeallocationCheckAndConfirmPage from '../../../pages/allocateToActivity/deallocationCheckAndConfirm'
import { formatDate, toDateString } from '../../../../server/utils/utils'

const allocations1 = [
  {
    id: 1,
    activityId: 1,
    prisonerNumber: 'A5015DY',
    activitySummary: 'Maths level 1',
    scheduleDescription: 'Entry level Maths 1',
    payBand: 'A',
    startDate: '2022-10-10',
    endDate: null,
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
  },
]
context('Deallocate from activities after an allocation', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=true', getActivities)
    cy.stubEndpoint('GET', '/activities/(\\d)*/schedules', getSchedulesInActivity)
    cy.stubEndpoint('GET', '/schedules/2/suitability\\?prisonerNumber=A5015DY', getCandidateSuitability)
    cy.stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels)
    cy.stubEndpoint('GET', '/schedules/2/non-associations\\?prisonerNumber=A5015DY', [])
    cy.stubEndpoint('GET', '/schedules/2/allocations\\?activeOnly=true&includePrisonerSummary=true', getAllocations)
    cy.stubEndpoint('GET', '/schedules/1/allocations\\?activeOnly=true', allocations1)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations)
    cy.stubEndpoint('GET', '/schedules/2/waiting-list-applications', JSON.parse('[]'))
    cy.stubEndpoint('GET', '/schedules/2/candidates(.)*', getCandidates)
    cy.stubEndpoint('GET', '/prisoner/A5015DY', getInmateDetails)
    cy.stubEndpoint('GET', '/incentive-reviews/prisoner/A5015DY', getPrisonerIepSummary)
    cy.stubEndpoint('GET', '/allocations/deallocation-reasons', getDeallocationReasons)
    cy.stubEndpoint('POST', '/schedules/2/allocations')
    cy.stubEndpoint('GET', '/allocations/id/2', prisonerAllocations[0].allocations[1])
    cy.stubEndpoint('GET', '/allocations/id/1', prisonerAllocations[0].allocations[0])
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails)
    cy.stubEndpoint('GET', '/schedules/2/allocations\\?activeOnly=true', getAllocationsMaths)
    cy.stubEndpoint('PUT', '/schedules/2/deallocate')

    const today = new Date()
    const hours = addHours(today, 2).getHours().toString().padStart(2, '0')
    const mins = today.getMinutes().toString().padStart(2, '0')
    resetActivityAndScheduleStubs(subWeeks(today, 2), 'english')

    resetActivityAndScheduleStubs(new Date(), 'maths', `${hours}:${mins}`)

    cy.signIn()
  })

  it('Allocate prisoner to an activity, and directly lead into a deallocation flow - remove 1 activity at end of day', () => {
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
    confirmationPage.deallocateLink()

    const deallocationDatePage = Page.verifyOnPage(DeallocationDatePage)
    deallocationDatePage.selectToday()
    deallocationDatePage.continue()

    const deallocationReasonPage = Page.verifyOnPage(DeallocationReasonPage)
    deallocationReasonPage.selectDeallocationReason('Completed course or task')
    deallocationReasonPage.continue()

    const deallocationCheckAndConfirmPage = Page.verifyOnPage(DeallocationCheckAndConfirmPage)
    deallocationCheckAndConfirmPage.assertSummaryDetail('Activity', 'Maths level 1')
    deallocationCheckAndConfirmPage.assertSummaryDetail(
      'End of allocation',
      formatDate(toDateString(new Date()), 'd MMMM yyyy'),
    )
    deallocationCheckAndConfirmPage.assertSummaryDetail('Reason for allocation ending', 'Completed course or task')
    deallocationCheckAndConfirmPage.confirmDeallocation()

    const confirmationPage2 = Page.verifyOnPage(ConfirmationPage)
    confirmationPage2.panelHeader().should('contain.text', 'Removal complete')
    confirmationPage2.getLinkByText('deallocateLink').should('not.exist')
  })
  it('Allocate prisoner to an activity, and directly lead into a deallocation flow - remove one "not in work" activity now', () => {
    const newMathsAllocations = [...getAllocationsMaths]
    newMathsAllocations[0].isUnemployment = true
    cy.stubEndpoint('GET', '/schedules/2/allocations\\?activeOnly=true', newMathsAllocations)
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.allocateToActivitiesCard().click()

    const manageActivitiesPage = Page.verifyOnPage(ManageActivitiesDashboardPage)
    manageActivitiesPage.allocateToActivityCard().click()

    const activitiesPage = Page.verifyOnPage(ActivitiesDashboardPage)
    activitiesPage.activityRows().should('have.length', 3)
    activitiesPage.selectActivityWithName('English level 1')

    const allocatePage = Page.verifyOnPage(AllocationDashboard)
    allocatePage.allocatedPeopleRows().should('have.length', 3)
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
    confirmationPage.deallocateLink()

    const deallocationDatePage = Page.verifyOnPage(DeallocationDatePage)
    deallocationDatePage.selectNow()
    deallocationDatePage.continue()

    const deallocationCheckAndConfirmPage = Page.verifyOnPage(DeallocationCheckAndConfirmPage)
    deallocationCheckAndConfirmPage.assertSummaryDetail('Activity', 'Maths level 1')
    deallocationCheckAndConfirmPage.assertSummaryDetail(
      'End of allocation',
      formatDate(toDateString(new Date()), 'd MMMM yyyy'),
    )
    deallocationCheckAndConfirmPage.confirmDeallocation()

    const confirmationPage2 = Page.verifyOnPage(ConfirmationPage)
    confirmationPage2.panelHeader().should('contain.text', 'Removal complete')
    confirmationPage2.getLinkByText('deallocateLink').should('not.exist')
  })
  it.only('Allocate prisoner to an activity, and directly lead into a deallocation flow - remove multiple activities', () => {
    const multipleAllocations = [...prisonerAllocations]
    multipleAllocations[0].allocations.push({
      id: 3,
      prisonerNumber: 'A5015DY',
      activitySummary: 'Science Level 1',
      scheduleDescription: 'Entry level Science 1',
      scheduleId: 1,
      payBand: 'A',
      isUnemployment: false,
      startDate: '2022-10-10',
      endDate: null,
      allocatedTime: '2022-10-10T09:30:00',
      allocatedBy: 'MR BLOGS',
      deallocatedTime: null,
      deallocatedBy: null,
      deallocatedReason: null,
    })
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', multipleAllocations)
    cy.stubEndpoint('GET', '/allocations/id/3', prisonerAllocations[0].allocations[2])
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.allocateToActivitiesCard().click()

    const manageActivitiesPage = Page.verifyOnPage(ManageActivitiesDashboardPage)
    manageActivitiesPage.allocateToActivityCard().click()

    const activitiesPage = Page.verifyOnPage(ActivitiesDashboardPage)
    activitiesPage.activityRows().should('have.length', 3)
    activitiesPage.selectActivityWithName('English level 1')

    const allocatePage = Page.verifyOnPage(AllocationDashboard)
    allocatePage.allocatedPeopleRows().should('have.length', 3)
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
    confirmationPage.deallocateLink()

    const selectActivitiesPage = Page.verifyOnPage(SelectActivitiesPage)
    selectActivitiesPage.selectCheckbox('')

    // const deallocationDatePage = Page.verifyOnPage(DeallocationDatePage)
    // deallocationDatePage.selectNow()
    // deallocationDatePage.continue()

    // const deallocationCheckAndConfirmPage = Page.verifyOnPage(DeallocationCheckAndConfirmPage)
    // deallocationCheckAndConfirmPage.assertSummaryDetail('Activity', 'Maths level 1')
    // deallocationCheckAndConfirmPage.assertSummaryDetail(
    //   'End of allocation',
    //   formatDate(toDateString(new Date()), 'd MMMM yyyy'),
    // )
    // deallocationCheckAndConfirmPage.confirmDeallocation()

    // const confirmationPage2 = Page.verifyOnPage(ConfirmationPage)
    // confirmationPage2.panelHeader().should('contain.text', 'Removal complete')
    // confirmationPage2.getLinkByText('deallocateLink').should('not.exist')
  })
})
