import { format, subDays, subWeeks } from 'date-fns'
import Page from '../../../pages/page'
import IndexPage from '../../../pages'
import AppointmentsManagementPage from '../../../pages/appointments/appointmentsManagementPage'
import SelectDatePage from '../../../pages/appointments/attendance/selectDate'
import getAppointmentAttendanceSummaries from '../../../fixtures/activitiesApi/appointments/getAppointmentAttendanceSummaries.json'
import getPrisoners from '../../../fixtures/activitiesApi/appointments/getPrisoners.json'
import getAppointmentLocations from '../../../fixtures/activitiesApi/appointments/getAppointmentLocationsMDI.json'
import getAppointmentsDetailsGym from '../../../fixtures/activitiesApi/appointments/getAppointmentsDetailsGym.json'
import getAppointmentsDetailsMultiple from '../../../fixtures/activitiesApi/appointments/getAppointmentsDetailsMultiple.json'
import getSingleAppointmentGym from '../../../fixtures/activitiesApi/appointments/getSingleAppointmentGym.json'
import SummariesPage from '../../../pages/appointments/attendance/summaries'
import getScheduledEvents from '../../../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import AttendeesPage from '../../../pages/appointments/attendance/attendees'
import { formatDate } from '../../../../server/utils/utils'
import EditAttendancePage from '../../../pages/appointments/attendance/editAttendance'
import AttendanceDetailsPage from '../../../pages/appointments/attendance/attendanceDetails'

context('Record appointment attendance', () => {
  const today = new Date()
  const todayFormatted = format(today, 'yyyy-MM-dd')
  const yesterday = subDays(today, 1)
  const yesterdayFormatted = format(yesterday, 'yyyy-MM-dd')
  const weekAgo = subWeeks(today, 1)
  const weekAgoFormatted = format(weekAgo, 'yyyy-MM-dd')

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
    cy.stubEndpoint(
      'GET',
      '/users/jsmith',
      JSON.parse('{"name": "John Smith", "username": "jsmith", "authSource": "nomis"}'),
    )
    cy.stubEndpoint(
      'GET',
      `/appointments/MDI/attendance-summaries\\?date=${todayFormatted}`,
      getAppointmentAttendanceSummaries,
    )
    cy.stubEndpoint('POST', `/prisoner-search/prisoner-numbers`, getPrisoners)
    cy.stubEndpoint('GET', '/appointment-locations/MDI', getAppointmentLocations)
    cy.stubEndpoint('POST', '/scheduled-events/prison/MDI\\?date=2024-11-05', getScheduledEvents)
    cy.stubEndpoint('PUT', `/appointments/updateAttendances\\?action=ATTENDED`)
    cy.stubEndpoint('PUT', `/appointments/updateAttendances\\?action=NOT_ATTENDED`)
    cy.stubEndpoint('PUT', `/appointments/updateAttendances\\?action=RESET`)
    cy.stubEndpoint('GET', '/appointments/1/details', getSingleAppointmentGym)
  })

  it('Should mark attendance for multiple appointment', () => {
    cy.stubEndpoint('POST', '/appointments/details', getAppointmentsDetailsMultiple)

    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.recordAppointmentsAttendanceCard().click()

    const selectDatePage = Page.verifyOnPage(SelectDatePage)
    selectDatePage.selectToday()
    selectDatePage.continue()

    const summariesPage = Page.verifyOnPage(SummariesPage)
    summariesPage.mainCaption().should('contain.text', 'Record appointment attendance')
    summariesPage.title().should('contain.text', 'Find an appointment to record or edit attendance')
    summariesPage.dateCaption().should('contain.text', formatDate(today, 'EEEE, d MMMM yyyy'))

    summariesPage.summaryAttended().should('contain.text', '1 (17%)')
    summariesPage.summaryAbsent().should('contain.text', '0 (0%)')
    summariesPage.summaryNotRecorded().should('contain.text', '5 (83%)')

    summariesPage.assertNumRows(3)
    summariesPage.assertRow(0, 'Gym', 'Gym', '11:00 to 13:30', '3', '1', '0', '2')
    summariesPage.assertRow(
      1,
      'Prayer',
      'In cell',
      '12:30 to 13:00',
      'Jarullah, Ytialel\nG4085VK\nOut of prison',
      '0',
      '0',
      '1',
    )
    summariesPage.assertRow(2, 'Chaplaincy', 'Chapel', '15:00 to 16:00', '2', '0', '0', '2')
    summariesPage.selectAppointmentsWithNames('Chaplaincy')
    summariesPage.getButton('Record or edit attendance').click()

    const attendeesPage = Page.verifyOnPage(AttendeesPage)
    attendeesPage.assertNumRows(5)
    attendeesPage.assertRowForMultipleAppointments(
      0,
      'Adalie, Izrmonntas',
      'A-N-3-43S',
      'Gym\n02:20 to 06:30\nIn cell',
      'Not recorded yet',
    )
    attendeesPage.assertRowForMultipleAppointments(
      1,
      'Alfres, Bumahwaju',
      'Out of prison',
      'Gym\n02:20 to 06:30\nIn cell',
      'Attended',
    )
    attendeesPage.assertRowForMultipleAppointments(
      2,
      'Alfres, Bumahwaju',
      'Out of prison',
      'Chaplaincy\n15:00 to 16:00\nMulti Faith',
      'Not recorded yet',
    )
    attendeesPage.assertRowForMultipleAppointments(
      3,
      'Augevieve, Uhohew',
      'UNKNOWN',
      'Chaplaincy\n15:00 to 16:00\nMulti Faith',
      'Not recorded yet',
    )
    attendeesPage.assertRowForMultipleAppointments(
      4,
      'Palabert, Ussalwe',
      'A-N-2-37N',
      'Gym\n02:20 to 06:30\nIn cell',
      'Not recorded yet',
    )
    attendeesPage.selectAttendees('Adalie, Izrmonntas', 'Palabert, Ussalwe')
    attendeesPage.getButton('Mark as attended').click()
    attendeesPage.notificationHeading().should('contain.text', 'Attendance recorded')
    attendeesPage.notificationBody().should('contain.text', "You've saved attendance details for 2 attendees")

    attendeesPage.assertNumRows(5)
    attendeesPage.assertRowForMultipleAppointments(
      0,
      'Adalie, Izrmonntas',
      'A-N-3-43S',
      'Gym\n02:20 to 06:30\nIn cell',
      'Not recorded yet',
    )
    attendeesPage.assertRowForMultipleAppointments(
      1,
      'Alfres, Bumahwaju',
      'Out of prison',
      'Gym\n02:20 to 06:30\nIn cell',
      'Attended',
    )
    attendeesPage.assertRowForMultipleAppointments(
      2,
      'Alfres, Bumahwaju',
      'Out of prison',
      'Chaplaincy\n15:00 to 16:00\nMulti Faith',
      'Not recorded yet',
    )
    attendeesPage.assertRowForMultipleAppointments(
      3,
      'Augevieve, Uhohew',
      'UNKNOWN',
      'Chaplaincy\n15:00 to 16:00\nMulti Faith',
      'Not recorded yet',
    )
    attendeesPage.assertRowForMultipleAppointments(
      4,
      'Palabert, Ussalwe',
      'A-N-2-37N',
      'Gym\n02:20 to 06:30\nIn cell',
      'Not recorded yet',
    )
    attendeesPage.selectAttendees('Adalie, Izrmonntas')
    attendeesPage.getButton('Mark as not attended').click()
    attendeesPage.notificationHeading().should('contain.text', 'Non-attendance recorded')
    attendeesPage.notificationBody().should('contain.text', "You've saved attendance details for Adalie Izrmonntas")

    cy.log('View attendance')

    attendeesPage.viewOrEdit(1, 'G8438VW').click()

    let attendanceDetails = Page.verifyOnPage(AttendanceDetailsPage)
    attendanceDetails.mainCaption().should('contain.text', 'Gym')
    attendanceDetails.title().should('contain.text', 'Attendance record for Bumahwaju Alfres')
    attendanceDetails.summary().should('contain.text', 'Gym on Tuesday, 5 November 2024')
    attendanceDetails
      .appointmentDetails()
      .find('dt')
      .then($dt => {
        expect($dt.get(0).innerText).to.contain('Attendance')
        expect($dt.get(1).innerText).to.contain('Recorded by')
        expect($dt.get(2).innerText).to.contain('Date and time')
      })
    attendanceDetails
      .appointmentDetails()
      .find('dd.govuk-summary-list__value')
      .then($dd => {
        expect($dd.get(0).innerText).to.contain('Attended')
        expect($dd.get(1).innerText).to.contain('jsmith - J. Smith')
        expect($dd.get(2).innerText).to.contain('6 November 2024 at 12:02')
      })
    attendanceDetails.getLinkByText('Change').click({ force: true })

    let editAttendancePage = Page.verifyOnPage(EditAttendancePage)
    editAttendancePage.mainCaption().should('contain.text', 'Gym')
    editAttendancePage.title().should('contain.text', 'Change attendance details for Bumahwaju Alfres')
    editAttendancePage.summary().should('contain.text', 'Gym on Tuesday, 5 November 2024')
    editAttendancePage.question().should('contain.text', 'Did Bumahwaju Alfres attend Gym on Tuesday, 5 November 2024?')

    cy.log('Edit attendance - non-attended')

    editAttendancePage.selectNo()
    editAttendancePage.continue()

    attendeesPage.notificationHeading().should('contain.text', 'Non-attendance recorded')
    attendeesPage.notificationBody().should('contain.text', "You've saved details for Bumahwaju Alfres.")

    cy.log('View attendance')

    attendeesPage.viewOrEdit(1, 'G8438VW').click()

    attendanceDetails = Page.verifyOnPage(AttendanceDetailsPage)
    attendanceDetails.getLinkByText('Change').click({ force: true })

    editAttendancePage = Page.verifyOnPage(EditAttendancePage)

    cy.log('Edit attendance - reset attendance')

    editAttendancePage.selectReset()
    editAttendancePage.continue()

    attendeesPage.notificationHeading().should('contain.text', 'Attendance reset')
    attendeesPage.notificationBody().should('contain.text', 'Attendance for Bumahwaju Alfres has been reset.')

    cy.log('View attendance')

    attendeesPage.viewOrEdit(1, 'G8438VW').click()

    attendanceDetails = Page.verifyOnPage(AttendanceDetailsPage)
    attendanceDetails.getLinkByText('Change').click({ force: true })

    editAttendancePage = Page.verifyOnPage(EditAttendancePage)

    cy.log('Edit attendance - attended')

    editAttendancePage.selectYes()
    editAttendancePage.continue()

    attendeesPage.notificationHeading().should('contain.text', 'Attendance recorded')
    attendeesPage.notificationBody().should('contain.text', "You've saved details for Bumahwaju Alfres.")
  })

  it('Should mark attendance for single appointment', () => {
    cy.stubEndpoint('POST', '/appointments/details', getAppointmentsDetailsGym)
    // cy.stubEndpoint('POST', '/scheduled-events/prison/MDI\\?date=2024-11-05', getScheduledEvents)

    // getAppointmentsDetailsGym[0].startDate = todayFormatted

    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.recordAppointmentsAttendanceCard().click()

    const selectDatePage = Page.verifyOnPage(SelectDatePage)
    selectDatePage.selectToday()
    selectDatePage.continue()

    const summariesPage = Page.verifyOnPage(SummariesPage)
    summariesPage.assertNumRows(3)
    summariesPage.selectAppointmentsWithNames('Chaplaincy')
    summariesPage.getButton('Record or edit attendance').click()

    const attendeesPage = Page.verifyOnPage(AttendeesPage)
    attendeesPage.mainCaption().should('contain.text', 'Record appointment attendance')
    attendeesPage.title().should('contain.text', 'Gym')
    attendeesPage.timeRangeCaption().should('contain.text', '02:20 to 06:30')
    attendeesPage.dateCaption().should('contain.text', 'Tuesday, 5 November 2024')
    attendeesPage.location().should('contain.text', 'Gym')
    attendeesPage.summaryAttended().should('contain.text', '1 (33%)')
    attendeesPage.summaryNotAttended().should('contain.text', '0 (0%)')
    attendeesPage.summaryNotRecorded().should('contain.text', '2 (67%)')
    attendeesPage.assertNumRows(3)
    attendeesPage.assertRowForSingleAppointments(0, 'Adalie, Izrmonntas', 'A-N-3-43S', 'Not recorded yet')
    attendeesPage.assertRowForSingleAppointments(1, 'Alfres, Bumahwaju', 'Out of prison', 'Attended')
    attendeesPage.assertRowForSingleAppointments(2, 'Augevieve, Uhohew', 'A-N-2-37N', 'Not recorded yet')
  })

  it('Should select appointments for yesterday', () => {
    cy.stubEndpoint(
      'GET',
      `/appointments/MDI/attendance-summaries\\?date=${yesterdayFormatted}`,
      getAppointmentAttendanceSummaries,
    )

    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.recordAppointmentsAttendanceCard().click()

    const selectDatePage = Page.verifyOnPage(SelectDatePage)
    selectDatePage.selectYesterday()
    selectDatePage.continue()

    Page.verifyOnPage(SummariesPage)
  })

  it('Should select appointments for another date', () => {
    cy.stubEndpoint(
      'GET',
      `/appointments/MDI/attendance-summaries\\?date=${weekAgoFormatted}`,
      getAppointmentAttendanceSummaries,
    )

    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.recordAppointmentsAttendanceCard().click()

    const selectDatePage = Page.verifyOnPage(SelectDatePage)
    selectDatePage.enterDate(new Date(weekAgo))
    selectDatePage.continue()

    Page.verifyOnPage(SummariesPage)
  })

  it('Should be able to filter appointments', () => {
    cy.stubEndpoint('POST', '/appointments/details', getAppointmentsDetailsMultiple)

    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.recordAppointmentsAttendanceCard().click()

    const selectDatePage = Page.verifyOnPage(SelectDatePage)
    selectDatePage.selectToday()
    selectDatePage.continue()

    const summariesPage = Page.verifyOnPage(SummariesPage)
    summariesPage.showingCaption().should('contain.text', 'Showing 3 appointments')
    summariesPage.assertNumRows(3)
    summariesPage.assertRow(0, 'Gym', 'Gym', '11:00 to 13:30', '3', '1', '0', '2')
    summariesPage.assertRow(
      1,
      'Prayer',
      'In cell',
      '12:30 to 13:00',
      'Jarullah, Ytialel\nG4085VK\nOut of prison',
      '0',
      '0',
      '1',
    )
    summariesPage.assertRow(2, 'Chaplaincy', 'Chapel', '15:00 to 16:00', '2', '0', '0', '2')
    summariesPage.locationRadios().find('input[value="OUT_OF_CELL"]').click()
    summariesPage.selectLocation('chape')
    summariesPage.getButton('Apply filters').eq(0).click()

    Page.verifyOnPage(SummariesPage)
    summariesPage.showingCaption().should('contain.text', 'Showing 1 appointment')
    summariesPage.assertNumRows(1)
    summariesPage.assertRow(0, 'Chaplaincy', 'Chapel', '15:00 to 16:00', '2', '0', '0', '2')
    summariesPage.locationRadios().find('input[value="IN_CELL"]').click()
    summariesPage.getButton('Apply filters').eq(0).click()

    Page.verifyOnPage(SummariesPage)
    summariesPage.showingCaption().should('contain.text', 'Showing 1 appointment')
    summariesPage.assertNumRows(1)
    summariesPage.assertRow(
      0,
      'Prayer',
      'In cell',
      '12:30 to 13:00',
      'Jarullah, Ytialel\nG4085VK\nOut of prison',
      '0',
      '0',
      '1',
    )
    summariesPage.locationRadios().find('input[value="ALL"]').click()

    summariesPage.getInputByLabel('Search by appointment name').type('yM')
    summariesPage.getButton('Search').click()

    cy.location().should(loc => {
      expect(loc.search).contains('searchTerm=yM')
    })
    summariesPage.showingCaption().should('contain.text', 'Showing 1 appointment')
    summariesPage.assertNumRows(1)
    summariesPage.assertRow(0, 'Gym', 'Gym', '11:00 to 13:30', '3', '1', '0', '2')
  })

  it('Should be able to filter attendees', () => {
    cy.stubEndpoint('POST', '/appointments/details', getAppointmentsDetailsMultiple)

    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.recordAppointmentsAttendanceCard().click()

    const selectDatePage = Page.verifyOnPage(SelectDatePage)
    selectDatePage.selectToday()
    selectDatePage.continue()

    const summariesPage = Page.verifyOnPage(SummariesPage)
    summariesPage.selectAppointmentsWithNames('Chaplaincy')
    summariesPage.getButton('Record or edit attendance').click()

    const attendeesPage = Page.verifyOnPage(AttendeesPage)
    attendeesPage.assertNumRows(5)
    attendeesPage.assertRowForMultipleAppointments(
      0,
      'Adalie, Izrmonntas',
      'A-N-3-43S',
      'Gym\n02:20 to 06:30\nIn cell',
      'Not recorded yet',
    )
    attendeesPage.assertRowForMultipleAppointments(
      1,
      'Alfres, Bumahwaju',
      'Out of prison',
      'Gym\n02:20 to 06:30\nIn cell',
      'Attended',
    )
    attendeesPage.assertRowForMultipleAppointments(
      2,
      'Alfres, Bumahwaju',
      'Out of prison',
      'Chaplaincy\n15:00 to 16:00\nMulti Faith',
      'Not recorded yet',
    )
    attendeesPage.assertRowForMultipleAppointments(
      3,
      'Augevieve, Uhohew',
      'UNKNOWN',
      'Chaplaincy\n15:00 to 16:00\nMulti Faith',
      'Not recorded yet',
    )
    attendeesPage.assertRowForMultipleAppointments(
      4,
      'Palabert, Ussalwe',
      'A-N-2-37N',
      'Gym\n02:20 to 06:30\nIn cell',
      'Not recorded yet',
    )
    attendeesPage.getInputByLabel('Search by prisoner name or prison number').type('Dali')
    attendeesPage.getButton('Search').click()

    cy.location().should(loc => {
      expect(loc.search).contains('searchTerm=Dali')
    })
    attendeesPage.assertNumRows(1)
    attendeesPage.assertRowForMultipleAppointments(
      0,
      'Adalie, Izrmonntas',
      'A-N-3-43S',
      'Gym\n02:20 to 06:30\nIn cell',
      'Not recorded yet',
    )
    attendeesPage.getInputByLabel('Search by prisoner name or prison number').clear().type('hWa')
    attendeesPage.getButton('Search').click()

    cy.location().should(loc => {
      expect(loc.search).contains('searchTerm=hWa')
    })
    attendeesPage.assertNumRows(2)
    attendeesPage.assertRowForMultipleAppointments(
      0,
      'Alfres, Bumahwaju',
      'Out of prison',
      'Gym\n02:20 to 06:30\nIn cell',
      'Attended',
    )
    attendeesPage.assertRowForMultipleAppointments(
      1,
      'Alfres, Bumahwaju',
      'Out of prison',
      'Chaplaincy\n15:00 to 16:00\nMulti Faith',
      'Not recorded yet',
    )
    attendeesPage.getInputByLabel('Search by prisoner name or prison number').clear().type('G0234GE')
    attendeesPage.getButton('Search').click()

    cy.location().should(loc => {
      expect(loc.search).contains('searchTerm=G0234GE')
    })
    attendeesPage.assertNumRows(1)
    attendeesPage.assertRowForMultipleAppointments(
      0,
      'Alfres, Bumahwaju',
      'Out of prison',
      'Chaplaincy\n15:00 to 16:00\nMulti Faith',
      'Not recorded yet',
    )
  })

  it('Should be able to navigate directly to attendees view', () => {
    cy.stubEndpoint('POST', '/appointments/details', getAppointmentsDetailsGym)

    cy.visit('/appointments/attendance/1/attendees')

    Page.verifyOnPage(AttendeesPage)
  })
})
