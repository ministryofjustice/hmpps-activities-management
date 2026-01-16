import { format, startOfToday, subDays } from 'date-fns'
import IndexPage from '../../../pages'
import Page from '../../../pages/page'
import ActivitiesIndexPage from '../../../pages/activities'
import AttendanceDashboardPage from '../../../pages/recordAttendance/attendanceDashboard'
import HowToRecordAttendancePage from '../../../pages/recordAttendance/attend-all/howToRecordAttendancePage'
import getActivities from '../../../fixtures/activitiesApi/getActivities.json'
import getActivity from '../../../fixtures/activitiesApi/getActivity.json'
import { formatIsoDate } from '../../../../server/utils/datePickerUtils'
import getScheduledInstanceEnglishLevel2 from '../../../fixtures/activitiesApi/getScheduledInstance11.json'
import getAttendanceList from '../../../fixtures/activitiesApi/getAttendanceList.json'
import getScheduledEvents from '../../../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import getInmateDetails from '../../../fixtures/prisonerSearchApi/getInmateDetailsForAttendance.json'
import getAttendanceReasons from '../../../fixtures/activitiesApi/getAttendanceReasons.json'
import getNonResidentialActivityLocations from '../../../fixtures/locationsinsideprison/non-residential-usage-activities.json'
import getCategories from '../../../fixtures/activitiesApi/getCategories.json'
import getAttendanceSummary from '../../../fixtures/activitiesApi/getAttendanceSummary-different-locations.json'
import SelectPeriodPage from '../../../pages/recordAttendance/selectPeriod'
import ActivitiesPage from '../../../pages/recordAttendance/activitiesPage'
import getLocationGroups from '../../../fixtures/activitiesApi/getLocationGroups.json'
import ChooseDetailsByResidentialLocationPage from '../../../pages/recordAttendance/attend-all/chooseDetailsByResidentialLocationPage'
import getPrisonPrisoners from '../../../fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A1350DZ-A8644DY.json'

context('Recording attendance for non-activity hub users', () => {
  const today = format(startOfToday(), 'yyyy-MM-dd')
  const getActivity1 = { ...getActivity }
  getActivity1.id = 1
  getActivity1.summary = 'Maths level 1'
  getActivity1.description = 'Maths level 1'
  getActivity1.schedules[0].startDate = formatIsoDate(subDays(new Date(), 1))
  let getInstances

  const toLocPrefix = (prefix: string) => JSON.parse(`{"locationPrefix": "${prefix}"}`)
  const locPrefixBlock1 = 'MDI-1-.+'
  const locPrefixBlock2AWing = 'MDI-1-1-0(0[1-9]|1[0-2]),MDI-1-2-0(0[1-9]|1[0-2]),MDI-1-3-0(0[1-9]|1[0-2])'
  const locPrefixBlock2BWing = 'MDI-1-1-0(1[3-9]|2[0-6]),MDI-1-2-0(1[3-9]|2[0-6]),MDI-1-3-0(1[3-9]|2[0-6])'
  const locPrefixBlock2CWing = 'MDI-1-1-0(2[7-9]|3[0-8]),MDI-1-2-0(2[7-9]|3[0-8]),MDI-1-3-0(2[7-9]|3[0-8])'

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

    cy.stubEndpoint(
      'GET',
      '/locations/prison/MDI/non-residential-usage-type\\?formatLocalName=true',
      getNonResidentialActivityLocations,
    )
    cy.stubEndpoint('GET', '/activity-categories', getCategories)
    cy.stubEndpoint(
      'GET',
      `/scheduled-instances/attendance-summary\\?prisonCode=MDI&date=${today}`,
      getAttendanceSummary,
    )
    cy.stubEndpoint('GET', `/scheduled-instances/93`, getInstances)
    cy.stubEndpoint('GET', '/scheduled-instances/93/scheduled-attendees', getAttendanceList)
    cy.stubEndpoint('GET', '/locations/prison/MDI/location-groups', getLocationGroups)
    cy.stubEndpoint('GET', `/prisons/MDI/scheduled-instances\\?startDate=${today}&endDate=${today}&slot=AM`, [
      getInstances,
    ])
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

  it('should not show the checkbox to select all activities - attendance by activity', () => {
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

    cy.get('#checkboxes-all').should('not.exist')
  })
  it('should not show the checkbox to select all - attendance by residential location', () => {
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

    cy.get('#checkboxes-all').should('not.exist')
  })
})
