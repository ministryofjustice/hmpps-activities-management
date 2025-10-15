import { format, startOfToday, subDays } from 'date-fns'
import IndexPage from '../../../pages'
import Page from '../../../pages/page'
import ActivitiesIndexPage from '../../../pages/activities'
import AttendanceDashboardPage from '../../../pages/recordAttendance/attendanceDashboard'
import HowToRecordAttendancePage from '../../../pages/recordAttendance/attend-all/howToRecordAttendancePage'
import getActivities from '../../../fixtures/activitiesApi/getActivities.json'
import getActivity from '../../../fixtures/activitiesApi/getActivity.json'
import ChooseDetailsToRecordAttendancePage from '../../../pages/recordAttendance/attend-all/chooseDetailsToRecordAttendancePage'
import { formatIsoDate } from '../../../../server/utils/datePickerUtils'
import SelectPeopleToRecordAttendanceForPage from '../../../pages/recordAttendance/attend-all/selectPeopleToRecordAttendanceForPage'
import getScheduledInstanceEnglishLevel2 from '../../../fixtures/activitiesApi/getScheduledInstance11.json'
import getAttendanceList from '../../../fixtures/activitiesApi/getAttendanceList.json'
import getScheduledEvents from '../../../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import getInmateDetails from '../../../fixtures/prisonerSearchApi/getInmateDetailsForAttendance.json'
import getAttendanceReasons from '../../../fixtures/activitiesApi/getAttendanceReasons.json'
import NotAttendedReasonPage from '../../../pages/recordAttendance/notAttendedReason'

context('Recording attendance for non-activity hub users', () => {
  const today = format(startOfToday(), 'yyyy-MM-dd')
  const getActivity1 = { ...getActivity }
  getActivity1.id = 1
  getActivity1.summary = 'Maths level 1'
  getActivity1.description = 'Maths level 1'
  getActivity1.schedules[0].startDate = formatIsoDate(subDays(new Date(), 1))
  let getInstances

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignInNonActivityHubUser')
    cy.signIn()

    cy.stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=true', getActivities)
    cy.stubEndpoint('GET', `/prisons/MDI/scheduled-instances\\?startDate=${today}&endDate=${today}`, JSON.parse('[]'))
    cy.stubEndpoint('GET', '/activities/1/filtered', getActivity1 as unknown as JSON)
    cy.stubEndpoint('GET', '/scheduled-instances/11/scheduled-attendees', getAttendanceList)
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${today}`, getScheduledEvents)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails)

    getInstances = JSON.parse(JSON.stringify(getScheduledInstanceEnglishLevel2))
    getInstances.date = today
    getInstances.attendances[2].status = 'WAITING'
    getInstances.attendances[2].attendanceReason = null

    cy.stubEndpoint('GET', `/prisons/MDI/scheduled-instances\\?startDate=${today}&endDate=${today}`, [getInstances])
    const G5897GP = getInmateDetails.find(prisoner => prisoner.prisonerNumber === 'G5897GP')
    cy.stubEndpoint('GET', '/prisoner/G5897GP', G5897GP as unknown as JSON)
    cy.stubEndpoint('PUT', '/attendances')
    cy.stubEndpoint('GET', '/attendance-reasons', getAttendanceReasons)
    cy.stubEndpoint('GET', '/scheduled-instances/11', getInstances)
  })

  it('should record attendance by activity - no activities available', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.recordAttendanceCard().click()

    const recordAttendancePage = Page.verifyOnPage(AttendanceDashboardPage)
    recordAttendancePage.recordAttendanceCard().click()

    const howToRecordAttendancePage = Page.verifyOnPage(HowToRecordAttendancePage)
    howToRecordAttendancePage.radioActivityClick().click()
    howToRecordAttendancePage.continue()

    const chooseDetailsToRecordAttendancePage = Page.verifyOnPage(ChooseDetailsToRecordAttendancePage)
    chooseDetailsToRecordAttendancePage.radioTodayClick()
    chooseDetailsToRecordAttendancePage.checkboxAMClick()
    chooseDetailsToRecordAttendancePage.searchBox().type('Maths level 1')
    chooseDetailsToRecordAttendancePage.continue()

    const selectPeopleToRecordAttendanceForPage = Page.verifyOnPage(SelectPeopleToRecordAttendanceForPage)
    selectPeopleToRecordAttendanceForPage.noActivities(
      'Maths level 1',
      'AM',
      format(new Date(today), 'EEEE, d MMMM yyyy'),
    )
    selectPeopleToRecordAttendanceForPage.selectDifferentDetails()
    Page.verifyOnPage(ChooseDetailsToRecordAttendancePage)
  })
  it('should record attendance by activity - 1 person - attended', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.recordAttendanceCard().click()

    const recordAttendancePage = Page.verifyOnPage(AttendanceDashboardPage)
    recordAttendancePage.recordAttendanceCard().click()

    const howToRecordAttendancePage = Page.verifyOnPage(HowToRecordAttendancePage)
    howToRecordAttendancePage.radioActivityClick().click()
    howToRecordAttendancePage.continue()

    const chooseDetailsToRecordAttendancePage = Page.verifyOnPage(ChooseDetailsToRecordAttendancePage)
    chooseDetailsToRecordAttendancePage.radioTodayClick()
    chooseDetailsToRecordAttendancePage.checkboxAMClick()
    chooseDetailsToRecordAttendancePage.searchBox().type('Maths level 1')
    chooseDetailsToRecordAttendancePage.continue()

    const selectPeopleToRecordAttendanceForPage = Page.verifyOnPage(SelectPeopleToRecordAttendanceForPage)
    selectPeopleToRecordAttendanceForPage.noActivities(
      'Maths level 1',
      'AM',
      format(new Date(today), 'EEEE, d MMMM yyyy'),
    )
    selectPeopleToRecordAttendanceForPage.selectDifferentDetails()
    Page.verifyOnPage(ChooseDetailsToRecordAttendancePage)

    chooseDetailsToRecordAttendancePage.radioTodayClick()
    chooseDetailsToRecordAttendancePage.checkboxPMClick()
    chooseDetailsToRecordAttendancePage.searchBox().type('English level 1')
    chooseDetailsToRecordAttendancePage.continue()

    Page.verifyOnPage(SelectPeopleToRecordAttendanceForPage)
    selectPeopleToRecordAttendanceForPage.checkAttendanceStatuses('Andy, Booking', 'Attended', 'Unpaid')
    selectPeopleToRecordAttendanceForPage.checkAttendanceStatuses('Aisho, Egurztof', 'Attended', 'Unpaid')
    selectPeopleToRecordAttendanceForPage.checkAttendanceStatuses('Aborah, Cudmastarie Hallone', 'Not recorded')
    selectPeopleToRecordAttendanceForPage.checkAttendanceStatuses('Arianniver, Eeteljan', 'Not recorded')

    const updatedInstance = JSON.parse(JSON.stringify(getScheduledInstanceEnglishLevel2))
    updatedInstance.date = today
    updatedInstance.attendances[2].status = 'COMPLETED'
    updatedInstance.attendances[2].attendanceReason = { code: 'ATTENDED', description: 'Attended' }
    cy.stubEndpoint('POST', '/scheduled-instances', [updatedInstance])
    cy.stubEndpoint('GET', `/prisons/MDI/scheduled-instances\\?startDate=${today}&endDate=${today}`, [updatedInstance])
    selectPeopleToRecordAttendanceForPage.selectPrisoner('Aborah, Cudmastarie Hallone')

    selectPeopleToRecordAttendanceForPage.markAsAttended()
    Page.verifyOnPage(SelectPeopleToRecordAttendanceForPage)

    selectPeopleToRecordAttendanceForPage.checkAttendanceStatuses('Aborah, Cudmastarie Hallone', 'Attended', 'Unpaid')
    selectPeopleToRecordAttendanceForPage.checkSuccessBanner(`You've saved attendance details for Cudmastarie Aborah`)
  })
  it('should record attendance by activity - 2 people - not attended', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.recordAttendanceCard().click()

    const recordAttendancePage = Page.verifyOnPage(AttendanceDashboardPage)
    recordAttendancePage.recordAttendanceCard().click()

    const howToRecordAttendancePage = Page.verifyOnPage(HowToRecordAttendancePage)
    howToRecordAttendancePage.radioActivityClick().click()
    howToRecordAttendancePage.continue()

    const chooseDetailsToRecordAttendancePage = Page.verifyOnPage(ChooseDetailsToRecordAttendancePage)

    chooseDetailsToRecordAttendancePage.radioTodayClick()
    chooseDetailsToRecordAttendancePage.checkboxPMClick()
    chooseDetailsToRecordAttendancePage.searchBox().type('English level 1')
    chooseDetailsToRecordAttendancePage.continue()

    const selectPeopleToRecordAttendanceForPage = Page.verifyOnPage(SelectPeopleToRecordAttendanceForPage)
    selectPeopleToRecordAttendanceForPage.checkAttendanceStatuses('Andy, Booking', 'Attended', 'Unpaid')
    selectPeopleToRecordAttendanceForPage.checkAttendanceStatuses('Aisho, Egurztof', 'Attended', 'Unpaid')
    selectPeopleToRecordAttendanceForPage.checkAttendanceStatuses('Aborah, Cudmastarie Hallone', 'Not recorded')
    selectPeopleToRecordAttendanceForPage.checkAttendanceStatuses('Arianniver, Eeteljan', 'Not recorded')

    const updatedInstance = JSON.parse(JSON.stringify(getScheduledInstanceEnglishLevel2))
    updatedInstance.date = today
    updatedInstance.attendances[2].status = 'COMPLETED'
    updatedInstance.attendances[2].attendanceReason = { code: 'SICK', description: 'Sick' }
    updatedInstance.attendances[2].issuePayment = true
    updatedInstance.attendances[3].status = 'COMPLETED'
    updatedInstance.attendances[3].attendanceReason = { code: 'SICK', description: 'Sick' }
    updatedInstance.attendances[3].issuePayment = true
    cy.stubEndpoint('POST', '/scheduled-instances', [updatedInstance])
    cy.stubEndpoint('GET', `/prisons/MDI/scheduled-instances\\?startDate=${today}&endDate=${today}`, [updatedInstance])
    selectPeopleToRecordAttendanceForPage.selectPrisoner('Aborah, Cudmastarie Hallone')
    selectPeopleToRecordAttendanceForPage.selectPrisoner('Arianniver, Eeteljan')

    selectPeopleToRecordAttendanceForPage.markAsNotAttended()

    const notAttendedReasonPage = Page.verifyOnPage(NotAttendedReasonPage)
    notAttendedReasonPage.selectRadio('notAttendedData[0][notAttendedReason]')
    notAttendedReasonPage.selectRadio('notAttendedData[0][sickPay]')
    notAttendedReasonPage.selectRadio('notAttendedData[1][notAttendedReason]')
    notAttendedReasonPage.selectRadio('notAttendedData[1][sickPay]')
    notAttendedReasonPage.submit()

    Page.verifyOnPage(SelectPeopleToRecordAttendanceForPage)

    selectPeopleToRecordAttendanceForPage.checkAttendanceStatuses('Aborah, Cudmastarie Hallone', 'Sick', 'Pay')
    selectPeopleToRecordAttendanceForPage.checkAttendanceStatuses('Arianniver, Eeteljan', 'Sick', 'Pay')
    selectPeopleToRecordAttendanceForPage.checkSuccessBanner(`You've saved attendance details for 2 attendees`)
  })
})
