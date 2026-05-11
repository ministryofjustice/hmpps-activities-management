import { addMonths } from 'date-fns'
import getActivities from '../../../fixtures/activitiesApi/getActivities.json'
import getSchedulesExternalActivity from '../../../fixtures/activitiesApi/getSchedulesExternalActivity.json'
import moorlandIncentiveLevels from '../../../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'

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

const navigateToActivitiesDashboard = (): AllocationDashboard => {
  const indexPage = Page.verifyOnPage(IndexPage)
  indexPage.activitiesCard().click()

  const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
  activitiesIndexPage.allocateToActivitiesCard().click()

  const manageActivitiesPage = Page.verifyOnPage(ManageActivitiesDashboardPage)
  manageActivitiesPage.allocateToActivityCard().click()

  const activitiesPage = Page.verifyOnPage(ActivitiesDashboardPage)
  activitiesPage.outsideActivities().click()
  activitiesPage.selectActivityWithName('Outside Cafe')

  const allocatePage = Page.verifyOnPage(AllocationDashboard)
  return allocatePage
}

context('Allocate to activity', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')

    cy.stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=true', getActivities)
    cy.stubEndpoint('GET', '/activities/(\\d)*/schedules', getSchedulesExternalActivity)
    cy.stubEndpoint('GET', '/activities/3/filtered\\?includeScheduledInstances=false', getSchedulesExternalActivity)

    cy.stubEndpoint('GET', '/activities/allocation-dashboard/3', getSchedulesExternalActivity)

    cy.stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels)
    cy.signInEAEnabled()
  })

  it('should be able to allocate when selecting a specific start date', () => {
    const allocatePage = navigateToActivitiesDashboard()
    allocatePage.allocatedPeopleRows().should('have.length', 3)
    allocatePage.nonAssociationsLink('G4793VF').contains('View non-associations')
    allocatePage.nonAssociationsLink('A1351DZ').should('not.exist')
    allocatePage.nonAssociationsLink('B1351RE').contains('View non-associations')
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
        'Review Alfonso Cholak’s 2 open non-associations in Moorland (HMP) to check that they can be safely allocated.',
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
})
