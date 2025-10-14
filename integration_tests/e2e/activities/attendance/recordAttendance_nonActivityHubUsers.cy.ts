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

context('Recording attendance for non-activity hub users', () => {
  const today = format(startOfToday(), 'yyyy-MM-dd')
  const getActivity1 = { ...getActivity }
  getActivity1.id = 1
  getActivity1.summary = 'Maths level 1'
  getActivity1.description = 'Maths level 1'
  getActivity1.schedules[0].startDate = formatIsoDate(subDays(new Date(), 1))

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignInNonActivityHubUser')
    cy.signIn()

    cy.stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=true', getActivities)
    cy.stubEndpoint('GET', `/prisons/MDI/scheduled-instances\\?startDate=${today}&endDate=${today}`, JSON.parse('[]'))
    cy.stubEndpoint('GET', '/activities/1/filtered', getActivity1 as unknown as JSON)
  })

  it('should record attendance by activity', () => {
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
    chooseDetailsToRecordAttendancePage.searchBox().type('Maths level 1')
    chooseDetailsToRecordAttendancePage.continue()
  })
})
