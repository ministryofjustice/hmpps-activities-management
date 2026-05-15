import { addMonths } from 'date-fns'
import getExternalActivities from '../../../fixtures/activitiesApi/getExternalActivities.json'
import getExternalActivity from '../../../fixtures/activitiesApi/getExternalActivity.json'
import getCandidates from '../../../fixtures/activitiesApi/getCandidates.json'
import getAllocations from '../../../fixtures/activitiesApi/getAllocations.json'
import getInmateDetails from '../../../fixtures/prisonerSearchApi/getPrisoner-MDI-A5015DY.json'
import getPrisonerA1350DZ from '../../../fixtures/prisonerSearchApi/getPrisoner-MDI-A1350DZ.json'
import getPrisonerA8644DY from '../../../fixtures/prisonerSearchApi/getPrisoner-MDI-A8644DY.json'
import getPrisonerA1351DZ from '../../../fixtures/prisonerSearchApi/getPrisoner-MDI-A1351DZ.json'
import prisonerAllocations from '../../../fixtures/activitiesApi/prisonerAllocations.json'
import getPrisonerIepSummary from '../../../fixtures/incentivesApi/getPrisonerIepSummary.json'
import getDeallocationReasons from '../../../fixtures/activitiesApi/getDeallocationReasons.json'
import getCandidateSuitability from '../../../fixtures/activitiesApi/getCandidateSuitability.json'
import getInmatesDetails from '../../../fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A1350DZ-A8644DY-A1351DZ.json'
import getNonAssociations from '../../../fixtures/activitiesApi/non_associations.json'
import moorlandIncentiveLevels from '../../../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'

import IndexPage from '../../../pages'
import Page from '../../../pages/page'
import StartDatePage from '../../../pages/allocateToActivity/startDate'
import EndDateOptionPage from '../../../pages/allocateToActivity/endDateOption'
import EndDatePage from '../../../pages/allocateToActivity/endDate'
import ActivitiesDashboardPage from '../../../pages/allocateToActivity/activitiesDashboard'
import SelectPrisonerPage from '../../../pages/allocateToActivity/selectPrisoner'
import HowToAddOptions from '../../../../server/enum/allocations'
import PayBandPage from '../../../pages/allocateToActivity/payBand'
import CheckAnswersPage from '../../../pages/allocateToActivity/checkAnswers'
import CancelPage from '../../../pages/allocateToActivity/cancel'
import ConfirmationPage from '../../../pages/allocateToActivity/confirmation'
import AllocationDashboard from '../../../pages/allocateToActivity/allocationDashboard'
import ManageActivitiesDashboardPage from '../../../pages/activities/manageActivitiesDashboard'
import ActivitiesIndexPage from '../../../pages/activities'
import ExclusionsPage from '../../../pages/allocateToActivity/exclusions'
import { ActivitySchedule } from '../../../../server/@types/activitiesAPI/types'
import SetUpPrisonerListMethodPage from '../../../pages/allocateToActivity/setUpPrisonerListMethod'
import CheckAndConfirmMultiplePage from '../../../pages/allocateToActivity/checkAndConfirmMultiple'
import ConfirmMultipleAllocationsPage from '../../../pages/allocateToActivity/confirmationMultiple'
import PayBandMultiplePage from '../../../pages/allocateToActivity/payBandMultiple'

const allocationJourneyPaid = {
  scheduledInstance: {
    id: 1238,
    activityId: 3,
    description: 'Outside Cafe',
    startDate: '2023-07-26',
    endDate: null,
    scheduleWeeks: 1,
    slots: [
      {
        id: 1,
        timeSlot: 'AM',
        weekNumber: 1,
        startTime: '08:30',
        endTime: '12:00',
        daysOfWeek: ['Mon'],
        mondayFlag: true,
        tuesdayFlag: false,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
      {
        id: 2,
        timeSlot: 'AM',
        weekNumber: 1,
        startTime: '08:30',
        endTime: '12:00',
        daysOfWeek: ['Tue'],
        mondayFlag: false,
        tuesdayFlag: true,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
      {
        id: 3,
        timeSlot: 'AM',
        weekNumber: 1,
        startTime: '08:30',
        endTime: '12:00',
        daysOfWeek: ['Wed'],
        mondayFlag: false,
        tuesdayFlag: false,
        wednesdayFlag: true,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
      {
        id: 4,
        timeSlot: 'AM',
        weekNumber: 1,
        startTime: '08:30',
        endTime: '12:00',
        daysOfWeek: ['Thu'],
        mondayFlag: false,
        tuesdayFlag: false,
        wednesdayFlag: false,
        thursdayFlag: true,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
      {
        id: 5,
        timeSlot: 'AM',
        weekNumber: 1,
        startTime: '08:30',
        endTime: '12:00',
        daysOfWeek: ['Fri'],
        mondayFlag: false,
        tuesdayFlag: false,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: true,
        saturdayFlag: false,
        sundayFlag: false,
      },
    ],
    internalLocationId: 1,
    scheduleType: 'STANDARD',
    activity: {
      id: 3,
      inCell: false,
      onWing: false,
      offWing: false,
      paid: true,
      outsideWork: true,
    },
    instances: [
      {
        id: 123,
        startDateTime: '2025-08-04 08:30',
        startTime: '08:30',
        date: '2025-08-04',
      },
    ],
  } as unknown as ActivitySchedule,
}

const allocationJourneyUnpaid = {
  scheduledInstance: {
    id: 1238,
    activityId: 4,
    description: 'Hotel',
    startDate: '2023-07-26',
    endDate: null,
    scheduleWeeks: 2,
    slots: [
      {
        id: 1,
        timeSlot: 'AM',
        weekNumber: 1,
        startTime: '08:30',
        endTime: '12:00',
        daysOfWeek: ['Mon'],
        mondayFlag: true,
        tuesdayFlag: false,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
      {
        id: 2,
        timeSlot: 'AM',
        weekNumber: 1,
        startTime: '08:30',
        endTime: '12:00',
        daysOfWeek: ['Tues'],
        mondayFlag: false,
        tuesdayFlag: true,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
      {
        id: 3,
        timeSlot: 'ED',
        weekNumber: 2,
        startTime: '18:00',
        endTime: '11:30',
        daysOfWeek: ['Sat'],
        mondayFlag: false,
        tuesdayFlag: false,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: true,
        sundayFlag: false,
      },
      {
        id: 4,
        timeSlot: 'ED',
        weekNumber: 2,
        startTime: '18:00',
        endTime: '11:30',
        daysOfWeek: ['Sun'],
        mondayFlag: false,
        tuesdayFlag: false,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: true,
      },
    ],
    internalLocationId: 1,
    scheduleType: 'STANDARD',
    activity: {
      id: 4,
      inCell: false,
      onWing: false,
      offWing: false,
      paid: false,
      outsideWork: true,
    },
    instances: [
      {
        id: 123,
        startDateTime: '2025-08-04 08:30',
        startTime: '08:30',
        date: '2025-08-04',
      },
    ],
  } as unknown as ActivitySchedule,
}

const navigateToActivitiesDashboard = (): ActivitiesDashboardPage => {
  const indexPage = Page.verifyOnPage(IndexPage)
  indexPage.activitiesCard().click()

  const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
  activitiesIndexPage.allocateToActivitiesCard().click()

  const manageActivitiesPage = Page.verifyOnPage(ManageActivitiesDashboardPage)
  manageActivitiesPage.allocateToActivityCard().click()

  const activitiesPage = Page.verifyOnPage(ActivitiesDashboardPage)
  return activitiesPage
}

context('Allocate to external activities', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')

    cy.stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=true', getExternalActivities)
    cy.stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels)
    cy.stubEndpoint('GET', '/schedules/1238/waiting-list-applications\\?includeNonAssociationsCheck=true', [])
    cy.stubEndpoint('GET', '/schedules/1238/candidates(.)*', getCandidates)
    cy.stubEndpoint('GET', '/schedules/1238/allocations\\?activeOnly=true&includePrisonerSummary=true', getAllocations)
    cy.stubEndpoint('GET', '/prisoner/A5015DY', getInmateDetails)
    cy.stubEndpoint('GET', '/incentive-reviews/prisoner/A5015DY', getPrisonerIepSummary)
    cy.stubEndpoint('GET', '/allocations/deallocation-reasons', getDeallocationReasons)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations)
    cy.stubEndpoint('POST', '/schedules/1238/allocations')

    cy.signInEAEnabled()
  })

  const prisonPaidStubs = () => {
    cy.stubEndpoint('GET', '/activities/3/filtered\\?includeScheduledInstances=false', getExternalActivity[0])
    cy.stubEndpoint('GET', '/activities/3/filtered', getExternalActivity[0])
    cy.stubEndpoint('GET', '/schedules/1238', allocationJourneyPaid.scheduledInstance)
  }

  const externallyPaidStubs = () => {
    cy.stubEndpoint('GET', '/activities/4/filtered\\?includeScheduledInstances=false', getExternalActivity[1])
    cy.stubEndpoint('GET', '/activities/4/filtered', getExternalActivity[1])
    cy.stubEndpoint('GET', '/schedules/1238', allocationJourneyUnpaid.scheduledInstance)
  }

  const multipleAllocationStubs = () => {
    cy.stubEndpoint('GET', '/schedules/2/suitability\\?prisonerNumber=A1350DZ', getCandidateSuitability)
    cy.stubEndpoint('GET', '/schedules/2/suitability\\?prisonerNumber=A8644DY', getCandidateSuitability)
    cy.stubEndpoint('GET', '/schedules/2/suitability\\?prisonerNumber=A1351DZ', getCandidateSuitability)
    cy.stubEndpoint('GET', '/prison/MDI/prisoners\\?term=s&size=50', getInmatesDetails)
    cy.stubEndpoint('POST', '/non-associations/involving\\?prisonId=MDI', getNonAssociations)
    cy.stubEndpoint('GET', '/prisoner/A1350DZ', getPrisonerA1350DZ)
    cy.stubEndpoint('GET', '/prisoner/A8644DY', getPrisonerA8644DY)
    cy.stubEndpoint('GET', '/prisoner/A1351DZ', getPrisonerA1351DZ)
    cy.stubEndpoint('GET', '/schedules/1238/allocations\\?includePrisonerSummary=true', [])
    cy.stubEndpoint('POST', '/schedules/1238/allocations/bulk')
  }

  it('should be able to allocate to prison paid activity', () => {
    prisonPaidStubs()

    const activitiesPage = navigateToActivitiesDashboard()
    activitiesPage.outsideActivities().click()
    activitiesPage.selectActivityWithName('Outside Cafe')

    const allocatePage = Page.verifyOnPage(AllocationDashboard)
    allocatePage.allocatedPeopleRows().should('have.length', 3)
    allocatePage.nonAssociationsLink('G4793VF').contains('View non-associations')
    allocatePage.nonAssociationsLink('A1351DZ').should('not.exist')
    allocatePage.nonAssociationsLink('B1351RE').contains('View non-associations')
    allocatePage.tabWithTitle('Outside Cafe schedule').click()
    allocatePage.activeTimeSlots().should('have.length', 1)

    allocatePage.tabWithTitle('Other people').click()
    allocatePage.candidateRows().should('have.length', 10)
    allocatePage.nonAssociationsLink('A5015DY').contains('View non-associations')
    allocatePage.selectCandidateWithName('Alfonso Cholak')

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
    payBandPage.selectPayBand('(Lowest) - £1.50')
    payBandPage.continue()

    const exclusionsPage = Page.verifyOnPage(ExclusionsPage)
    exclusionsPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.location().contains('Outside')
    checkAnswersPage.cancel()

    const cancelPage = Page.verifyOnPage(CancelPage)
    cancelPage.selectOption('No')
    cancelPage.confirm()

    const checkAnswersPage2 = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage2.confirmAllocation()

    Page.verifyOnPage(ConfirmationPage)
  })

  it('should be able to allocate to an externally paid activity', () => {
    externallyPaidStubs()

    const activitiesPage = navigateToActivitiesDashboard()
    activitiesPage.outsideActivities().click()
    activitiesPage.selectActivityWithName('Hotel')

    const allocatePage = Page.verifyOnPage(AllocationDashboard)
    allocatePage.allocatedPeopleRows().should('have.length', 3)
    allocatePage.nonAssociationsLink('G4793VF').contains('View non-associations')
    allocatePage.nonAssociationsLink('A1351DZ').should('not.exist')
    allocatePage.nonAssociationsLink('B1351RE').contains('View non-associations')
    allocatePage.tabWithTitle('Hotel').click()
    allocatePage.activeTimeSlots().should('have.length', 1)

    allocatePage.tabWithTitle('Other people').click()
    allocatePage.candidateRows().should('have.length', 10)
    allocatePage.nonAssociationsLink('A5015DY').contains('View non-associations')
    allocatePage.selectCandidateWithName('Alfonso Cholak')

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

    const exclusionsPage = Page.verifyOnPage(ExclusionsPage)
    exclusionsPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.location().contains('Outside')
    checkAnswersPage.cancel()

    const cancelPage = Page.verifyOnPage(CancelPage)
    cancelPage.selectOption('No')
    cancelPage.confirm()

    const checkAnswersPage2 = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage2.confirmAllocation()

    Page.verifyOnPage(ConfirmationPage)
  })

  it('should be able to allocate multiple people to an prison paid activity', () => {
    prisonPaidStubs()
    multipleAllocationStubs()

    const activitiesPage = navigateToActivitiesDashboard()
    activitiesPage.outsideActivities().click()
    activitiesPage.selectActivityWithName('Outside Cafe')

    const allocatePage = Page.verifyOnPage(AllocationDashboard)
    allocatePage.allocatedPeopleRows().should('have.length', 3)
    allocatePage.nonAssociationsLink('G4793VF').contains('View non-associations')
    allocatePage.nonAssociationsLink('A1351DZ').should('not.exist')
    allocatePage.nonAssociationsLink('B1351RE').contains('View non-associations')
    allocatePage.tabWithTitle('Outside Cafe').click()
    allocatePage.activeTimeSlots().should('have.length', 1)

    allocatePage.tabWithTitle('Other people').click()
    allocatePage.allocateGroupLink()

    const setUpPrisonerListMethodPage = Page.verifyOnPage(SetUpPrisonerListMethodPage)
    setUpPrisonerListMethodPage.selectHowToAddDecisionRadio(HowToAddOptions.SEARCH)
    setUpPrisonerListMethodPage.getButton('Continue').click()

    const selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.caption().should('contain.text', 'Outside Cafe')
    selectPrisonerPage.enterQuery('s')
    selectPrisonerPage.getButton('Search').click()
    selectPrisonerPage.selectRadio('A1350DZ').click()
    selectPrisonerPage.selectPrisonerAndContinue()

    selectPrisonerPage.addAnotherPersonLink()
    selectPrisonerPage.enterQuery('s')
    selectPrisonerPage.getButton('Search').click()
    selectPrisonerPage.selectRadio('A8644DY').click()
    selectPrisonerPage.selectPrisonerAndContinue()

    selectPrisonerPage.addAnotherPersonLink()
    selectPrisonerPage.enterQuery('s')
    selectPrisonerPage.getButton('Search').click()
    selectPrisonerPage.selectRadio('A1351DZ').click()
    selectPrisonerPage.selectPrisonerAndContinue()

    selectPrisonerPage.inmateRows().should('have.length', 3)
    selectPrisonerPage.continue()

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
    payBandMultiplePage.clickDetails()
    payBandMultiplePage.checkTableCell(0, 'Winchurch, David Bob')
    payBandMultiplePage.checkTableCell(1, 'Enhanced incentive level:\nPay band 1 (Lowest) - £1.50')
    payBandMultiplePage.continue()

    const checkAndConfirmMultiple = Page.verifyOnPage(CheckAndConfirmMultiplePage)
    checkAndConfirmMultiple.inmatePayRows().should('have.length', 3)
    checkAndConfirmMultiple.checkTableCell(0, 'Winchurch, David Bob')
    checkAndConfirmMultiple.checkTableCell(1, 'Enhanced incentive level:\nPay band 1 (Lowest) - £1.50')
    checkAndConfirmMultiple.checkTableCell(4, 'Enhanced incentive level:\nPay band 1 (Lowest) - £1.50')
    checkAndConfirmMultiple.checkTableCell(7, 'Standard incentive level:\nPay band 2 (Medium) - £1.90')
    checkAndConfirmMultiple.checkTableCell(8, 'Change')
    checkAndConfirmMultiple.location().contains('Outside')
    checkAndConfirmMultiple.selectConfirm('Confirm 3 allocations').click()

    const confirmMultipleAllocationsPage = Page.verifyOnPage(ConfirmMultipleAllocationsPage)
    confirmMultipleAllocationsPage.panelHeader().should('contain.text', 'Allocations complete')
    confirmMultipleAllocationsPage.panelText().should('contain.text', '3 people are now allocated to Outside Cafe')
    confirmMultipleAllocationsPage.activityPageLink().click()
    cy.location().should(loc => {
      expect(loc.pathname).to.eq('/activities/allocation-dashboard/3')
    })
    cy.go('back')
    confirmMultipleAllocationsPage.allocationsDashLink().click()
    cy.location().should(loc => {
      expect(loc.pathname).to.eq('/activities/allocation-dashboard')
    })
  })

  it('should be able to allocate multiple people to an externally paid activity', () => {
    externallyPaidStubs()
    multipleAllocationStubs()

    const activitiesPage = navigateToActivitiesDashboard()
    activitiesPage.outsideActivities().click()
    activitiesPage.selectActivityWithName('Hotel')

    const allocatePage = Page.verifyOnPage(AllocationDashboard)
    allocatePage.allocatedPeopleRows().should('have.length', 3)
    allocatePage.nonAssociationsLink('G4793VF').contains('View non-associations')
    allocatePage.nonAssociationsLink('A1351DZ').should('not.exist')
    allocatePage.nonAssociationsLink('B1351RE').contains('View non-associations')
    allocatePage.tabWithTitle('Hotel').click()
    allocatePage.activeTimeSlots().should('have.length', 1)

    allocatePage.tabWithTitle('Other people').click()
    allocatePage.allocateGroupLink()

    const setUpPrisonerListMethodPage = Page.verifyOnPage(SetUpPrisonerListMethodPage)
    setUpPrisonerListMethodPage.selectHowToAddDecisionRadio(HowToAddOptions.SEARCH)
    setUpPrisonerListMethodPage.getButton('Continue').click()

    const selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.caption().should('contain.text', 'Hotel')
    selectPrisonerPage.enterQuery('s')
    selectPrisonerPage.getButton('Search').click()
    selectPrisonerPage.selectRadio('A1350DZ').click()
    selectPrisonerPage.selectPrisonerAndContinue()

    selectPrisonerPage.addAnotherPersonLink()
    selectPrisonerPage.enterQuery('s')
    selectPrisonerPage.getButton('Search').click()
    selectPrisonerPage.selectRadio('A8644DY').click()
    selectPrisonerPage.selectPrisonerAndContinue()

    selectPrisonerPage.addAnotherPersonLink()
    selectPrisonerPage.enterQuery('s')
    selectPrisonerPage.getButton('Search').click()
    selectPrisonerPage.selectRadio('A1351DZ').click()
    selectPrisonerPage.selectPrisonerAndContinue()

    selectPrisonerPage.inmateRows().should('have.length', 3)
    selectPrisonerPage.continue()

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

    const checkAndConfirmMultiple = Page.verifyOnPage(CheckAndConfirmMultiplePage)
    cy.get(`[data-qa="prisoner-pay-list"]`).should('not.exist')
    checkAndConfirmMultiple.location().contains('Outside')
    checkAndConfirmMultiple.selectConfirm('Confirm 3 allocations').click()

    const confirmMultipleAllocationsPage = Page.verifyOnPage(ConfirmMultipleAllocationsPage)
    confirmMultipleAllocationsPage.panelHeader().should('contain.text', 'Allocations complete')
    confirmMultipleAllocationsPage.panelText().should('contain.text', '3 people are now allocated to Hotel')
    confirmMultipleAllocationsPage.activityPageLink().click()
    cy.location().should(loc => {
      expect(loc.pathname).to.eq('/activities/allocation-dashboard/4')
    })
    cy.go('back')
    confirmMultipleAllocationsPage.allocationsDashLink().click()
    cy.location().should(loc => {
      expect(loc.pathname).to.eq('/activities/allocation-dashboard')
    })
  })
})
