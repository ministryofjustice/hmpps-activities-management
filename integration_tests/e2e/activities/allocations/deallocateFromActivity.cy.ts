import { addDays, addMinutes, addMonths, subDays, subWeeks } from 'date-fns'
import { formatDate } from 'date-fns/format'
import getActivities from '../../../fixtures/activitiesApi/getActivities.json'
import getAllocations from '../../../fixtures/activitiesApi/getAllocations.json'
import prisonerAllocations from '../../../fixtures/activitiesApi/prisonerAllocations.json'
import moorlandIncentiveLevels from '../../../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import getInmateDetails from '../../../fixtures/prisonerSearchApi/getInmateDetailsForDeallocation.json'
import getDeallocationReasons from '../../../fixtures/activitiesApi/getDeallocationReasons.json'
import getMdiPrisonPayBands from '../../../fixtures/activitiesApi/getMdiPrisonPayBands.json'
import getCandidates from '../../../fixtures/activitiesApi/getCandidates.json'

import IndexPage from '../../../pages'
import Page from '../../../pages/page'
import EndDatePage from '../../../pages/allocateToActivity/endDate'
import ActivitiesDashboardPage from '../../../pages/allocateToActivity/activitiesDashboard'
import CheckAnswersPage from '../../../pages/allocateToActivity/checkAnswers'
import ConfirmationPage from '../../../pages/allocateToActivity/confirmation'
import AllocationDashboard from '../../../pages/allocateToActivity/allocationDashboard'
import ManageActivitiesDashboardPage from '../../../pages/activities/manageActivitiesDashboard'
import ActivitiesIndexPage from '../../../pages/activities'
import DeallocateTodayOptionPage from '../../../pages/allocateToActivity/deallocateTodayOption'
import DeallocationReasonPage from '../../../pages/allocateToActivity/deallocationReason'
import EndDecisionPage from '../../../pages/allocateToActivity/endDecision'
import resetActivityAndScheduleStubs from './allocationsStubHelper'

context('Deallocation from activity', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=true', getActivities)
    cy.stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels)
    cy.stubEndpoint('GET', '/schedules/2/allocations\\?activeOnly=true&includePrisonerSummary=true', getAllocations)
    cy.stubEndpoint('GET', '/schedules/2/allocations\\?activeOnly=true', getAllocations)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations)
    cy.stubEndpoint('GET', '/schedules/2/waiting-list-applications', JSON.parse('[]'))
    cy.stubEndpoint('GET', '/schedules/2/candidates(.)*', getCandidates)
    cy.stubEndpoint('GET', '/allocations/deallocation-reasons', getDeallocationReasons)
    cy.stubEndpoint('GET', '/prison/MDI/prison-pay-bands', getMdiPrisonPayBands)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails)
    cy.stubEndpoint('PUT', '/schedules/2/deallocate')

    cy.signIn()
  })

  describe('Activity has already started', () => {
    it('should de-allocate from sessions after today', () => {
      // Set start date to 15 days ago so no activity session today
      resetActivityAndScheduleStubs(subDays(subWeeks(new Date(), 2), 1))

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
      allocationDashboardPage.allocatedPeopleRows().should('have.length', 3)
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

    it('should de-allocate from session today and remove any attendances later today', () => {
      // Set start date to 2 weeks ago so activity session is later today
      resetActivityAndScheduleStubs(subWeeks(new Date(), 2), formatDate(addMinutes(new Date(), 2), 'HH:mm'))

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

      cy.stubEndpoint(
        'POST',
        '/prisoner-search/prisoner-numbers',
        getInmateDetails.filter(f => f.prisonerNumber === 'G4793VF'),
      )

      const allocationDashboardPage = Page.verifyOnPage(AllocationDashboard)
      allocationDashboardPage.allocatedPeopleRows().should('have.length', 3)
      allocationDashboardPage.selectAllocatedPrisonerByName('Bloggs, Jo')
      allocationDashboardPage.deallocateSelectedPrisoners()

      const deallocateTodayOptionPage = Page.verifyOnPage(DeallocateTodayOptionPage)
      deallocateTodayOptionPage.selectDeallocateToday()
      deallocateTodayOptionPage.continue()

      const deallocationReasonPage = Page.verifyOnPage(DeallocationReasonPage)
      deallocationReasonPage.selectDeallocationReason('Health')
      deallocationReasonPage.continue()

      const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
      checkAnswersPage.confirmDeallocation()

      Page.verifyOnPage(ConfirmationPage)
    })
  })

  describe('Activity starts in the future', () => {
    it('should de-allocate from sessions', () => {
      // Set start date to tomorrow
      resetActivityAndScheduleStubs(addDays(new Date(), 1))

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

      cy.stubEndpoint(
        'POST',
        '/prisoner-search/prisoner-numbers',
        getInmateDetails.filter(f => f.prisonerNumber === 'G4793VF'),
      )

      const allocationDashboardPage = Page.verifyOnPage(AllocationDashboard)
      allocationDashboardPage.allocatedPeopleRows().should('have.length', 3)
      allocationDashboardPage.selectAllocatedPrisonerByName('Bloggs, Jo')
      allocationDashboardPage.deallocateSelectedPrisoners()

      const deallocationEndDecisionPage = Page.verifyOnPage(EndDecisionPage)
      deallocationEndDecisionPage.selectEndDecisionRadio('BEFORE_START')
      deallocationEndDecisionPage.continue()

      const deallocationReasonPage = Page.verifyOnPage(DeallocationReasonPage)
      deallocationReasonPage.selectDeallocationReason('Health')
      deallocationReasonPage.continue()

      const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
      checkAnswersPage.confirmDeallocation()

      Page.verifyOnPage(ConfirmationPage)
    })
  })
})
