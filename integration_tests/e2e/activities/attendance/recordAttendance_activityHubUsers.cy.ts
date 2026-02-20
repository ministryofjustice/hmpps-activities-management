import { format, startOfToday } from 'date-fns'
import IndexPage from '../../../pages'
import Page from '../../../pages/page'
import SelectPeriodPage from '../../../pages/recordAttendance/selectPeriod'
import ActivitiesPage from '../../../pages/recordAttendance/activitiesPage'
import AttendanceListPage from '../../../pages/recordAttendance/attendanceList'
import CancelSessionReason from '../../../pages/recordAttendance/cancelSessionReason'
import CancelSessionConfirm from '../../../pages/recordAttendance/cancelSessionConfirm'
import UncancelSessionConfirm from '../../../pages/recordAttendance/uncancelSessionConfirm'
import getAttendanceSummary from '../../../fixtures/activitiesApi/getAttendanceSummary.json'
import getScheduledInstance from '../../../fixtures/activitiesApi/getScheduledInstance93.json'
import getAttendeesForScheduledInstance from '../../../fixtures/activitiesApi/getAttendeesScheduledInstance93.json'
import getCancelledScheduledInstance from '../../../fixtures/activitiesApi/getScheduledInstance-cancelled.json'
import getScheduledEvents from '../../../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import getInmateDetails from '../../../fixtures/prisonerSearchApi/getInmateDetailsForAttendance.json'
import getCategories from '../../../fixtures/activitiesApi/getCategories.json'
import AttendanceDashboardPage from '../../../pages/recordAttendance/attendanceDashboard'
import ActivitiesIndexPage from '../../../pages/activities'
import CancelSessionPaymentPage from '../../../pages/recordAttendance/cancelSessionPayment'
import HowToRecordAttendancePage from '../../../pages/recordAttendance/attend-all/howToRecordAttendancePage'
import ChooseDetailsByResidentialLocationPage from '../../../pages/recordAttendance/attend-all/chooseDetailsByResidentialLocationPage'
import getPrisonPrisoners from '../../../fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A1350DZ-A8644DY.json'
import getLocationGroups from '../../../fixtures/activitiesApi/getLocationGroups.json'
import getScheduledInstanceEnglishLevel2 from '../../../fixtures/activitiesApi/getScheduledInstance11.json'
import SelectPeopleByResidentialLocationPage from '../../../pages/recordAttendance/attend-all/selectPeopleByResidentialLocationPage'
import getNonResidentialActivityLocations from '../../../fixtures/locationsinsideprison/non-residential-usage-activities.json'

context('Record attendance for activity hub users', () => {
  const today = format(startOfToday(), 'yyyy-MM-dd')
  let getInstances

  const toLocPrefix = (prefix: string) => JSON.parse(`{"locationPrefix": "${prefix}"}`)
  const locPrefixBlock1 = 'MDI-1-.+'
  const locPrefixBlock2AWing = 'MDI-1-1-0(0[1-9]|1[0-2]),MDI-1-2-0(0[1-9]|1[0-2]),MDI-1-3-0(0[1-9]|1[0-2])'
  const locPrefixBlock2BWing = 'MDI-1-1-0(1[3-9]|2[0-6]),MDI-1-2-0(1[3-9]|2[0-6]),MDI-1-3-0(1[3-9]|2[0-6])'
  const locPrefixBlock2CWing = 'MDI-1-1-0(2[7-9]|3[0-8]),MDI-1-2-0(2[7-9]|3[0-8]),MDI-1-3-0(2[7-9]|3[0-8])'

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()

    getScheduledInstance.date = today
    getCancelledScheduledInstance.date = today

    getInstances = JSON.parse(JSON.stringify(getScheduledInstanceEnglishLevel2))
    getInstances.date = today
    getInstances.attendances = [
      {
        id: 1,
        prisonerNumber: 'A1350DZ',
        attendanceReason: null,
        comment: null,
        posted: false,
        recordedTime: null,
        recordedBy: null,
        status: 'WAITING',
        payAmount: null,
        bonusAmount: null,
        pieces: null,
        issuePayment: false,
        editable: true,
        scheduleInstanceId: 11,
      },
      {
        id: 2,
        prisonerNumber: 'A8644DY',
        attendanceReason: null,
        comment: null,
        posted: false,
        recordedTime: null,
        recordedBy: null,
        status: 'WAITING',
        payAmount: null,
        bonusAmount: null,
        pieces: null,
        issuePayment: false,
        editable: true,
        scheduleInstanceId: 11,
      },
    ]

    cy.stubEndpoint(
      'GET',
      `/scheduled-instances/attendance-summary\\?prisonCode=MDI&date=${today}`,
      getAttendanceSummary,
    )
    cy.stubEndpoint('GET', '/scheduled-instances/93', getScheduledInstance)
    cy.stubEndpoint('GET', '/scheduled-instances/93/scheduled-attendees', getAttendeesForScheduledInstance)
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${today}`, getScheduledEvents)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails)
    cy.stubEndpoint('PUT', '/attendances')
    cy.stubEndpoint('GET', '/activity-categories', getCategories)
    cy.stubEndpoint('PUT', '/scheduled-instances/cancel')
    cy.stubEndpoint('PUT', '/scheduled-instances/93/uncancel')
    cy.stubEndpoint(
      'GET',
      '/locations/prison/MDI/non-residential-usage-type\\?formatLocalName=true',
      getNonResidentialActivityLocations,
    )
    cy.stubEndpoint('GET', '/locations/prison/MDI/location-groups', getLocationGroups)
    cy.stubEndpoint('GET', `/prisons/MDI/scheduled-instances\\?startDate=${today}&endDate=${today}&slot=AM`, [
      getInstances,
    ])
    cy.stubEndpoint('POST', '/scheduled-instances', [getInstances])
    cy.stubEndpoint(
      'GET',
      '/locations/prison/MDI/location-prefix\\?groupName=Houseblock%201',
      toLocPrefix(locPrefixBlock1),
    )
    cy.stubEndpoint(
      'GET',
      '/locations/prison/MDI/location-prefix\\?groupName=Houseblock%201',
      toLocPrefix(locPrefixBlock1),
    )
    cy.stubEndpoint(
      'GET',
      '/locations/prison/MDI/location-prefix\\?groupName=Houseblock%201_A-Wing',
      toLocPrefix(locPrefixBlock2AWing),
    )
    cy.stubEndpoint(
      'GET',
      '/locations/prison/MDI/location-prefix\\?groupName=Houseblock%201_B-Wing',
      toLocPrefix(locPrefixBlock2BWing),
    )
    cy.stubEndpoint(
      'GET',
      '/locations/prison/MDI/location-prefix\\?groupName=Houseblock%201_C-Wing',
      toLocPrefix(locPrefixBlock2CWing),
    )
    cy.stubEndpoint(
      'GET',
      '/prison/MDI/prisoners\\?page=0&size=1024&cellLocationPrefix=MDI-1-&sort=cellLocation',
      getPrisonPrisoners,
    )
  })

  it('should click through record attendance journey - by activity', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.recordAttendanceCard().click()

    const recordAttendancePage = Page.verifyOnPage(AttendanceDashboardPage)
    recordAttendancePage.recordAttendanceCard().click()

    const howToRecordAttendancePage = Page.verifyOnPage(HowToRecordAttendancePage)
    howToRecordAttendancePage.radioActivityClick().click()
    howToRecordAttendancePage.continue()

    const selectPeriodPage = Page.verifyOnPage(SelectPeriodPage)
    selectPeriodPage.enterDate(new Date(today))
    selectPeriodPage.selectAM()
    selectPeriodPage.continue()

    const activitiesPage = Page.verifyOnPage(ActivitiesPage)
    activitiesPage.containsActivities('English level 1', 'English level 2', 'Football', 'Maths level 1')
    activitiesPage.back()

    Page.verifyOnPage(SelectPeriodPage)
    selectPeriodPage.enterDate(new Date(today))
    selectPeriodPage.selectPM()
    selectPeriodPage.continue()

    activitiesPage.containsActivities('English level 1', 'English level 2', 'Football', 'Gym', 'Maths level 1')
    activitiesPage.selectActivityWithName('English level 1')

    const attendanceListPage = Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.checkClashingEventsStatuses('Aborah, Cudmastarie', 'Attended', 'Paid')
    attendanceListPage.checkAttendanceStatuses('Andy, Booking', 'Attended', 'Pay')
    attendanceListPage.checkClashingEventsStatuses('Andy, Booking', 'Paid', 'Did not attend')
    attendanceListPage.selectPrisoner('Aborah, Cudmastarie')
    attendanceListPage.selectPrisoner('Arianniver, Eeteljan')
    attendanceListPage.markAsAttended()
    Page.verifyOnPage(AttendanceListPage)

    attendanceListPage.cancelSessionButton().click()
    cy.stubEndpoint('GET', '/scheduled-instances/93', getCancelledScheduledInstance)

    const cancelSessionReasonPage = Page.verifyOnPage(CancelSessionReason)
    cancelSessionReasonPage.selectReason('Location unavailable')
    cancelSessionReasonPage.moreDetailsInput().type('Location in use')
    cancelSessionReasonPage.continue()

    const cancelPaymentPage = Page.verifyOnPage(CancelSessionPaymentPage)
    cancelPaymentPage.issuePayment('Yes')
    cancelPaymentPage.continue()

    const cancelSessionConfirmPage = Page.verifyOnPage(CancelSessionConfirm)
    cancelSessionConfirmPage.selectConfirmation('Yes')
    cancelSessionConfirmPage.confirm()

    Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.checkAttendanceStatuses('Andy, Booking', 'Cancelled', 'Pay')
    attendanceListPage.checkAttendanceStatuses('Aisho, Egurztof', 'Cancelled', 'Pay')
    attendanceListPage.assertNotificationContents(
      'Session cancelled',
      'This activity session has been cancelled by USER1 - J. Smith on Thursday, 2 February 2023 for the following reason:',
      'Location unavailable - this is a comment',
    )

    attendanceListPage.getLinkByText('Uncancel this session').click()

    cy.stubEndpoint('GET', '/scheduled-instances/93', getScheduledInstance)

    const uncancelSessionConfirmPage = Page.verifyOnPage(UncancelSessionConfirm)
    uncancelSessionConfirmPage.selectReason('Yes')
    uncancelSessionConfirmPage.confirm()

    Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.assertNotificationContents('Session no longer cancelled')
  })
  it('should click through record attendance journey - by residential location', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.recordAttendanceCard().click()

    const recordAttendancePage = Page.verifyOnPage(AttendanceDashboardPage)
    recordAttendancePage.recordAttendanceCard().click()

    const howToRecordAttendancePage = Page.verifyOnPage(HowToRecordAttendancePage)
    howToRecordAttendancePage.radioActivityLocationClick().click()
    howToRecordAttendancePage.continue()

    const chooseDetailsByResidentialLocationPage = Page.verifyOnPage(ChooseDetailsByResidentialLocationPage)

    chooseDetailsByResidentialLocationPage.radioTodayClick()
    chooseDetailsByResidentialLocationPage.radioAMClick()
    chooseDetailsByResidentialLocationPage.selectLocation('Houseblock 1')
    chooseDetailsByResidentialLocationPage.continue()

    const selectPeopleByResidentialLocationPage = Page.verifyOnPage(SelectPeopleByResidentialLocationPage)

    selectPeopleByResidentialLocationPage.checkAttendanceStats({
      totalAttendees: 2,
      totalAttendanceRecords: 2,
      totalAttended: 0,
      totalAbsences: 0,
      totalNotRecorded: 2,
    })

    selectPeopleByResidentialLocationPage.selectPrisoner('Gregs, Stephen')
    selectPeopleByResidentialLocationPage.selectPrisoner('Smith, John')
    selectPeopleByResidentialLocationPage.markAsAttended()

    selectPeopleByResidentialLocationPage.assertNotificationContents(
      'Attendance recorded',
      "You've saved attendance details for 2 attendees",
    )
  })
})
