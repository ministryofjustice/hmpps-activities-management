import { addMonths } from 'date-fns'
import getExternalActivities from '../../../fixtures/activitiesApi/getExternalActivities.json'
import getExternalActivity from '../../../fixtures/activitiesApi/getExternalActivity.json'
import getCandidates from '../../../fixtures/activitiesApi/getCandidates.json'
import getAllocations from '../../../fixtures/activitiesApi/getAllocations.json'
import getInmateDetails from '../../../fixtures/prisonerSearchApi/getPrisoner-MDI-A5015DY.json'
import prisonerAllocations from '../../../fixtures/activitiesApi/prisonerAllocations.json'
import getPrisonerIepSummary from '../../../fixtures/incentivesApi/getPrisonerIepSummary.json'
import getDeallocationReasons from '../../../fixtures/activitiesApi/getDeallocationReasons.json'
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
import ActivitiesIndexPage from '../../../pages/activities'
import ExclusionsPage from '../../../pages/allocateToActivity/exclusions'
import { ActivitySchedule } from '../../../../server/@types/activitiesAPI/types'

const allocationJourneyPaid = {
  scheduledInstance: {
    id: 1238,
    activityId: 3,
    description: 'Outside Work',
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

  const externallyPaidStubs = () => {
    cy.stubEndpoint('GET', '/activities/3/filtered\\?includeScheduledInstances=false', getExternalActivity[0])
    cy.stubEndpoint('GET', '/activities/3/filtered', getExternalActivity[0])
    cy.stubEndpoint('GET', '/schedules/1238', allocationJourneyPaid.scheduledInstance)
  }

  const prisonPaidStubs = () => {
    cy.stubEndpoint('GET', '/activities/4/filtered\\?includeScheduledInstances=false', getExternalActivity[1])
    cy.stubEndpoint('GET', '/activities/4/filtered', getExternalActivity[1])
    cy.stubEndpoint('GET', '/schedules/1238', allocationJourneyUnpaid.scheduledInstance)
  }

  it('should be able to allocate to prison paid activity', () => {
    externallyPaidStubs()

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
    checkAnswersPage.cancel()

    const cancelPage = Page.verifyOnPage(CancelPage)
    cancelPage.selectOption('No')
    cancelPage.confirm()

    const checkAnswersPage2 = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage2.confirmAllocation()

    Page.verifyOnPage(ConfirmationPage)
  })

  it('should be able to allocate to an externally paid activity', () => {
    prisonPaidStubs()

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
    checkAnswersPage.cancel()

    const cancelPage = Page.verifyOnPage(CancelPage)
    cancelPage.selectOption('No')
    cancelPage.confirm()

    const checkAnswersPage2 = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage2.confirmAllocation()

    Page.verifyOnPage(ConfirmationPage)
  })
})
