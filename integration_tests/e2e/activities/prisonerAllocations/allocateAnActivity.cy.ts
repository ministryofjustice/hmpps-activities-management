import { subWeeks } from 'date-fns'
import prisonerAllocations from '../../../fixtures/prisonerAllocations/getPrisonerAllocations-60995GW.json'
import prisonerDetails from '../../../fixtures/prisonerSearchApi/getPrisonerDetails-G0995GW.json'
import prisonerNonAssociations from '../../../fixtures/nonAssociationsApi/getNonAssociations-G0995GW.json'
import getActivities from '../../../fixtures/prisonerAllocations/getPrisonerWaitlistActivities.json'
import rolloutPlan from '../../../fixtures/activitiesApi/rollout.json'
import getMdiPrisonPayBands from '../../../fixtures/activitiesApi/getMdiPrisonPayBands.json'
import moorlandIncentiveLevels from '../../../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import PrisonerAllocationsDashboardPage from '../../../pages/activities/prisonerAllocations/PrisonerAllocationsDashboardPage'
import Page from '../../../pages/page'
import WaitListAllocationPage from '../../../pages/activities/prisonerAllocations/WaitListAllocationPage'
import BeforeYouAllocate from '../../../pages/allocateToActivity/beforeYouAllocate'
import PendingApplicationsPage from '../../../pages/activities/prisonerAllocations/PendingApplicationsPage'
import getPrisonerIepSummary from '../../../fixtures/prisonerAllocations/getPrisonerSummary-G0995GW.json'
import { Activity, ActivitySchedule } from '../../../../server/@types/activitiesAPI/types'
import getCandidateSuitability from '../../../fixtures/activitiesApi/getCandidateSuitability.json'
import resetActivityAndScheduleStubs from '../allocations/allocationsStubHelper'

const prisonerNumber = 'G0995GW'
const prisonCode = 'MDI'

const baseWaitlistApplication = {
  id: 213,
  activityId: 539,
  scheduleId: 518,
  allocationId: null,
  prisonCode,
  prisonerNumber,
  bookingId: 1136879,
  requestedDate: '2025-06-24',
  requestedBy: 'PRISONER',
  comments: 'Test',
  declinedReason: null,
  creationTime: '2025-06-24T08:34:22',
  createdBy: 'SCH_ACTIVITY',
  updatedTime: '2025-07-16T15:20:10',
  updatedBy: 'DTHOMAS_GEN',
  earliestReleaseDate: {
    releaseDate: '2019-11-30',
    isTariffDate: false,
    isIndeterminateSentence: false,
    isImmigrationDetainee: false,
    isConvictedUnsentenced: false,
    isRemand: false,
  },
  nonAssociations: false,
  activity: {
    id: 539,
    activityName: 'Maths level 1',
    category: {
      id: 3,
      code: 'SAA_PRISON_JOBS',
      name: 'Prison jobs',
      description: 'Such as kitchen, cleaning, gardens or other maintenance and services to keep the prison running',
    },
    capacity: 8,
    allocated: 4,
    waitlisted: 3,
    createdTime: '2023-10-23T09:59:24',
    activityState: 'LIVE',
  },
}

const mockActivity = {
  id: 539,
  description: 'Admin Orderly',
  schedules: [{ id: 518 }],
} as Activity

const allocationJourney = {
  scheduledInstance: {
    schedule: {
      id: 518,
      activityId: 539,
      description: 'Maths',
      startDate: '2023-07-26',
      endDate: '2026-08-26',
      scheduleWeeks: 2,
      internalLocationId: 1,
      scheduleType: 'STANDARD',
      activity: {
        id: 539,
        inCell: false,
        onWing: true,
        offWing: false,
        paid: true,
      },
      internalLocation: {
        description: 'Education room 1',
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
  },
}

const commonSetup = (waitlistStatus: 'APPROVED' | 'PENDING') => {
  const waitlistApplication = {
    ...baseWaitlistApplication,
    status: waitlistStatus,
    statusUpdatedTime: waitlistStatus === 'APPROVED' ? '2025-07-16T15:20:10' : '2025-07-20T10:00:00',
  }

  const waitlistResults = {
    content: [waitlistApplication],
    totalPages: 1,
    pageNumber: 0,
    totalElements: 1,
    first: true,
    last: false,
  }

  // Stubs
  cy.task('reset')
  cy.task('stubSignIn')

  cy.stubEndpoint('GET', `/prisoner/${prisonerNumber}`, prisonerDetails)
  cy.stubEndpoint('GET', `/prisoner/${prisonerNumber}/non-associations`, prisonerNonAssociations)
  cy.stubEndpoint('POST', `/prisons/${prisonCode}/prisoner-allocations`, prisonerAllocations)
  cy.stubEndpoint('GET', `/activities/prisoner-allocations/${prisonerNumber}`, prisonerAllocations)
  cy.stubEndpoint('GET', `/rollout/${prisonCode}`, rolloutPlan)
  cy.stubEndpoint('POST', `/waiting-list-applications/${prisonCode}/search`, waitlistResults)
  cy.stubEndpoint('GET', `/prison/${prisonCode}/activities\\?excludeArchived=true`, getActivities)
  cy.stubEndpoint('GET', '/activities/539/filtered', mockActivity)
  cy.stubEndpoint('GET', '/schedules/518', allocationJourney.scheduledInstance.schedule)
  cy.stubEndpoint('GET', `/schedules/518/non-associations\\?prisonerNumber=${prisonerNumber}`, prisonerNonAssociations)
  cy.stubEndpoint('GET', `/schedules/518/suitability\\?prisonerNumber=${prisonerNumber}`, getCandidateSuitability)
  cy.stubEndpoint('GET', `/incentive/prison-levels/${prisonCode}`, moorlandIncentiveLevels)
  cy.stubEndpoint('GET', `/prison/${prisonCode}/prison-pay-bands`, getMdiPrisonPayBands)
  cy.stubEndpoint('GET', `/incentive-reviews/prisoner/${prisonerNumber}`, getPrisonerIepSummary)
  cy.stubEndpoint('PATCH', '/waiting-list-applications/213', waitlistResults)
  cy.task('stubOffenderImage')

  resetActivityAndScheduleStubs({ activityStartDate: subWeeks(new Date(), 2) })
  cy.signIn()
}

context('Waitlist - Prisoner Allocations Page', () => {
  it('Should allocate an APPROVED activity to a prisoner', () => {
    commonSetup('APPROVED')

    cy.visit(`/activities/prisoner-allocations/${prisonerNumber}`)
    const prisonerAllocationsPage = Page.verifyOnPage(PrisonerAllocationsDashboardPage)

    const expectedDetails = [
      { label: 'Location', value: 'A-N-3-30N' },
      { label: 'Incentive level', value: 'Standard' },
      { label: 'Earliest release date', value: '30 November 2019' },
      { label: 'Workplace risk assessment', value: 'None' },
    ]
    const linkLabels = ['Location', 'Incentive level', 'Earliest release date']

    prisonerAllocationsPage.getPrisonerName('Aeticake Potta').should('be.visible')
    prisonerAllocationsPage.verifyMiniProfileDetails(expectedDetails)
    prisonerAllocationsPage.verifyMiniProfileLinks(linkLabels)
    prisonerAllocationsPage.getLinkByText('Suspend all allocations').should('be.visible')
    prisonerAllocationsPage.getLinkByText("Aeticake Potta's schedule (opens in new tab)").should('be.visible')

    prisonerAllocationsPage.getLinkByText('Allocate to an activity').should('be.visible').click()
    const waitlistAllocationPage = Page.verifyOnPage(WaitListAllocationPage)
    waitlistAllocationPage.getAllocateToActivityCaption().should('be.visible')
    waitlistAllocationPage.selectRadioByLabel('Maths level 1')
    waitlistAllocationPage.continue()

    const beforeYouAllocatePage = Page.verifyOnPage(BeforeYouAllocate)
    beforeYouAllocatePage
      .nonAssociationsCountPara()
      .contains(
        'Review Aeticake Potta’s 1 open non-association in Moorland to check that they can be safely allocated.',
      )
  })

  it('Should allocate a PENDING activity to a prisoner', () => {
    commonSetup('PENDING')

    cy.visit(`/activities/prisoner-allocations/${prisonerNumber}`)
    const prisonerAllocationsPage = Page.verifyOnPage(PrisonerAllocationsDashboardPage)

    const expectedDetails = [
      { label: 'Location', value: 'A-N-3-30N' },
      { label: 'Incentive level', value: 'Standard' },
      { label: 'Earliest release date', value: '30 November 2019' },
      { label: 'Workplace risk assessment', value: 'None' },
    ]
    const linkLabels = ['Location', 'Incentive level', 'Earliest release date']

    prisonerAllocationsPage.getPrisonerName('Aeticake Potta').should('be.visible')
    prisonerAllocationsPage.verifyMiniProfileDetails(expectedDetails)
    prisonerAllocationsPage.verifyMiniProfileLinks(linkLabels)
    prisonerAllocationsPage.getLinkByText('Suspend all allocations').should('be.visible')
    prisonerAllocationsPage.getLinkByText("Aeticake Potta's schedule (opens in new tab)").should('be.visible')

    prisonerAllocationsPage.getLinkByText('Allocate to an activity').should('be.visible').click()
    const waitlistAllocationPage = Page.verifyOnPage(WaitListAllocationPage)
    waitlistAllocationPage.getAllocateToActivityCaption().should('be.visible')
    waitlistAllocationPage.selectRadioByLabel('Maths level 1')
    waitlistAllocationPage.continue()

    const pendingApplicationsPage = Page.verifyOnPage(PendingApplicationsPage)
    pendingApplicationsPage.selectRadioByLabel('Yes')
    pendingApplicationsPage.continue()

    const beforeYouAllocatePage = Page.verifyOnPage(BeforeYouAllocate)
    beforeYouAllocatePage
      .nonAssociationsCountPara()
      .contains(
        'Review Aeticake Potta’s 1 open non-association in Moorland to check that they can be safely allocated.',
      )
  })
})
