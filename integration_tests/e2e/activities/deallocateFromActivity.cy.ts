import { addDays, addMonths } from 'date-fns'
import getActivities from '../../fixtures/activitiesApi/getActivities.json'
import getAllocations from '../../fixtures/activitiesApi/getAllocations.json'
import prisonerAllocations from '../../fixtures/activitiesApi/prisonerAllocations.json'
import getSchedule from '../../fixtures/activitiesApi/getSchedule.json'
import moorlandIncentiveLevels from '../../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import getInmateDetails from '../../fixtures/prisonerSearchApi/getInmateDetailsForDeallocation.json'
import getActivity from '../../fixtures/activitiesApi/getActivity.json'
import getDeallocationReasons from '../../fixtures/activitiesApi/getDeallocationReasons.json'
import getMdiPrisonPayBands from '../../fixtures/activitiesApi/getMdiPrisonPayBands.json'
import getCandidates from '../../fixtures/activitiesApi/getCandidates.json'

import IndexPage from '../../pages'
import Page from '../../pages/page'
import EndDatePage from '../../pages/allocateToActivity/endDate'
import ActivitiesDashboardPage from '../../pages/allocateToActivity/activitiesDashboard'
import CheckAnswersPage from '../../pages/allocateToActivity/checkAnswers'
import ConfirmationPage from '../../pages/allocateToActivity/confirmation'
import AllocationDashboard from '../../pages/allocateToActivity/allocationDashboard'
import ManageActivitiesDashboardPage from '../../pages/activities/manageActivitiesDashboard'
import ActivitiesIndexPage from '../../pages/activities'
import DeallocationReasonPage from '../../pages/allocateToActivity/deallocationReason'
import EndDecisionPage from '../../pages/allocateToActivity/endDecision'
import { formatIsoDate } from '../../../server/utils/datePickerUtils'

context('Deallocation from activity', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=true', getActivities)
    cy.stubEndpoint('GET', '/schedules/2', getSchedule)
    cy.stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels)
    cy.stubEndpoint('GET', '/schedules/2/allocations\\?activeOnly=true&includePrisonerSummary=true', getAllocations)
    cy.stubEndpoint('GET', '/schedules/2/allocations\\?activeOnly=true', getAllocations)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations)
    cy.stubEndpoint('GET', '/schedules/2/waiting-list-applications', JSON.parse('[]'))
    cy.stubEndpoint('GET', '/schedules/2/candidates(.)*', getCandidates)
    cy.stubEndpoint('GET', '/activities/2/filtered', getActivity)
    cy.stubEndpoint('GET', '/allocations/deallocation-reasons', getDeallocationReasons)
    cy.stubEndpoint('GET', '/prison/MDI/prison-pay-bands', getMdiPrisonPayBands)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails)
    cy.stubEndpoint('PUT', '/schedules/2/deallocate')

    cy.signIn()
  })

  it('should click through deallocate from activity journey', () => {
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

    const allocationDashboardPage = Page.verifyOnPage(AllocationDashboard)
    allocationDashboardPage.allocatedPeopleRows().should('have.length', 2)
    allocationDashboardPage.selectAllocatedPrisonerByName('Bloggs, Jo')
    allocationDashboardPage.selectAllocatedPrisonerByName('Body, No')
    allocationDashboardPage.deallocateSelectedPrisoners()

    const endDatePage = Page.verifyOnPage(EndDatePage)
    const endDate = addMonths(new Date(), 8)
    endDatePage.selectDatePickerDate(endDate)
    endDatePage.continue()

    const deallocationReasonPage = Page.verifyOnPage(DeallocationReasonPage)
    deallocationReasonPage.selectDeallocationReason('Withdrawn by staff')
    deallocationReasonPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.confirmDeallocation()

    Page.verifyOnPage(ConfirmationPage)
  })

  it('should click through deallocate from activity journey where active is yet to start', () => {
    const getActivity2 = { ...getActivity }
    getActivity2.schedules[0].startDate = formatIsoDate(addDays(new Date(), 1))
    for (let i = 0; i < getActivity2.schedules[0].allocations.length; i += 1) {
      getActivity2.schedules[0].allocations[i].startDate = getActivity2.schedules[0].startDate
    }

    cy.stubEndpoint('GET', '/activities/2/filtered', getActivity2)

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

    const allocationDashboardPage = Page.verifyOnPage(AllocationDashboard)
    allocationDashboardPage.allocatedPeopleRows().should('have.length', 2)
    allocationDashboardPage.selectAllocatedPrisonerByName('Bloggs, Jo')
    allocationDashboardPage.selectAllocatedPrisonerByName('Body, No')
    allocationDashboardPage.deallocateSelectedPrisoners()

    const deallocationEndDecisionPage = Page.verifyOnPage(EndDecisionPage)
    deallocationEndDecisionPage.selectEndDecisionRadio('BEFORE_START')
    deallocationEndDecisionPage.continue()

    const deallocationReasonPage = Page.verifyOnPage(DeallocationReasonPage)
    deallocationReasonPage.selectDeallocationReason('Withdrawn by staff')
    deallocationReasonPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.confirmDeallocation()

    Page.verifyOnPage(ConfirmationPage)
  })
})
