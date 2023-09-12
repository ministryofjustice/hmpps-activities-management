import { addDays } from 'date-fns'
import Page from '../../pages/page'
import IndexPage from '../../pages'
import AppointmentsManagementPage from '../../pages/appointments/appointmentsManagementPage'
import SelectPrisonerPage from '../../pages/appointments/create-and-edit/selectPrisonerPage'
import NamePage from '../../pages/appointments/create-and-edit/namePage'
import LocationPage from '../../pages/appointments/create-and-edit/locationPage'
import getPrisonPrisoners from '../../fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A8644DY.json'
import getPrisonerA8644DY from '../../fixtures/prisonerSearchApi/getPrisoner-MDI-A8644DY.json'
import getCategories from '../../fixtures/activitiesApi/getAppointmentCategories.json'
import getAppointmentLocations from '../../fixtures/prisonApi/getMdiAppointmentLocations.json'
import getScheduledEvents from '../../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import getAppointmentSeries from '../../fixtures/activitiesApi/getAppointmentSeries.json'
import getAppointmentSeriesDetails from '../../fixtures/activitiesApi/getAppointmentSeriesDetails.json'
import DateAndTimePage from '../../pages/appointments/create-and-edit/dateAndTimePage'
import RepeatPage from '../../pages/appointments/create-and-edit/repeatPage'
import CheckAnswersPage from '../../pages/appointments/create-and-edit/checkAnswersPage'
import ConfirmationPage from '../../pages/appointments/create-and-edit/confirmationPage'
import ExtraInformationPage from '../../pages/appointments/create-and-edit/extraInformationPage'
import RepeatFrequencyAndCountPage from '../../pages/appointments/create-and-edit/repeatFrequencyAndCountPage'
import { formatDate } from '../../../server/utils/utils'
import SchedulePage from '../../pages/appointments/create-and-edit/schedulePage'

context('Create individual appointment - back links', () => {
  const tomorrow = addDays(new Date(), 1)
  const tomorrowFormatted = formatDate(tomorrow, 'yyyy-MM-dd')
  // To pass validation we must ensure the appointment details start date is set to tomorrow
  getAppointmentSeriesDetails.startDate = tomorrowFormatted
  getAppointmentSeriesDetails.appointments[0].startDate = getAppointmentSeriesDetails.startDate
  getScheduledEvents.activities
    .filter(e => e.prisonerNumber === 'A7789DY')
    .forEach(e => {
      e.prisonerNumber = 'A8644DY'
    })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
    cy.stubEndpoint('GET', '/prison/MDI/prisoners\\?term=A8644DY&size=50', getPrisonPrisoners)
    cy.stubEndpoint('GET', '/prisoner/A8644DY', getPrisonerA8644DY)
    cy.stubEndpoint('GET', '/appointment-categories', getCategories)
    cy.stubEndpoint('GET', '/appointment-locations/MDI', getAppointmentLocations)
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${tomorrowFormatted}`, getScheduledEvents)
    cy.stubEndpoint('POST', '/appointment-series', getAppointmentSeries)
    cy.stubEndpoint('GET', '/appointment-series/10/details', getAppointmentSeriesDetails)
  })

  it('Create individual appointment - back links', () => {
    // Move through the journey to final page with back link
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    Page.verifyOnPage(AppointmentsManagementPage)
    cy.visit('/appointments/create/start-individual')

    let selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.enterPrisonerNumber('A8644DY')
    selectPrisonerPage.searchButton().click()

    selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.continueButton().click()

    const namePage = Page.verifyOnPage(NamePage)
    namePage.selectCategory('Chaplaincy')
    namePage.continue()

    const locationPage = Page.verifyOnPage(LocationPage)
    locationPage.selectLocation('Chapel')
    locationPage.continue()

    const dateAndTimePage = Page.verifyOnPage(DateAndTimePage)
    dateAndTimePage.enterStartDate(tomorrow)
    dateAndTimePage.selectStartTime(14, 0)
    dateAndTimePage.selectEndTime(15, 30)
    dateAndTimePage.continue()

    const repeatPage = Page.verifyOnPage(RepeatPage)
    repeatPage.selectRepeat('No')
    repeatPage.continue()

    const schedulePage = Page.verifyOnPage(SchedulePage)
    schedulePage.continue()

    const extraInformationPage = Page.verifyOnPage(ExtraInformationPage)

    // Click through back links
    extraInformationPage.back()
    Page.verifyOnPage(SchedulePage)

    schedulePage.back()
    Page.verifyOnPage(RepeatPage)
    repeatPage.assertRepeat('No')

    repeatPage.back()
    Page.verifyOnPage(DateAndTimePage)
    dateAndTimePage.assertStartDate(tomorrow)
    dateAndTimePage.assertStartTime(14, 0)
    dateAndTimePage.assertEndTime(15, 30)

    dateAndTimePage.back()
    Page.verifyOnPage(LocationPage)
    locationPage.assertSelectedLocation('Chapel')

    locationPage.back()
    Page.verifyOnPage(NamePage)
    namePage.assertSelectedCategory('Chaplaincy')

    namePage.back()
    Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.assertEnteredPrisonerNumber('A8644DY')

    // Continue to extra information page
    selectPrisonerPage.continue()
    namePage.continue()
    locationPage.continue()
    dateAndTimePage.continue()
    repeatPage.continue()
    schedulePage.continue()

    Page.verifyOnPage(ExtraInformationPage)
    extraInformationPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertNoBackLink()

    // Back links from check answers
    checkAnswersPage.changePrisoner()
    Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.back()
    Page.verifyOnPage(CheckAnswersPage)

    checkAnswersPage.changeName()
    Page.verifyOnPage(NamePage)
    namePage.back()
    Page.verifyOnPage(CheckAnswersPage)

    checkAnswersPage.changeLocation()
    Page.verifyOnPage(LocationPage)
    locationPage.back()
    Page.verifyOnPage(CheckAnswersPage)

    checkAnswersPage.changeStartDate()
    Page.verifyOnPage(DateAndTimePage)
    dateAndTimePage.back()
    Page.verifyOnPage(CheckAnswersPage)

    checkAnswersPage.changeStartTime()
    Page.verifyOnPage(DateAndTimePage)
    dateAndTimePage.back()
    Page.verifyOnPage(CheckAnswersPage)

    checkAnswersPage.changeEndTime()
    Page.verifyOnPage(DateAndTimePage)
    dateAndTimePage.back()
    Page.verifyOnPage(CheckAnswersPage)

    checkAnswersPage.changeRepeat()
    Page.verifyOnPage(RepeatPage)
    repeatPage.back()
    Page.verifyOnPage(CheckAnswersPage)

    // Repeat is a two page sub journey. Check it can be partially changed then backed out of without changing the answer
    checkAnswersPage.changeRepeat()
    Page.verifyOnPage(RepeatPage)
    repeatPage.selectRepeat('Yes')
    repeatPage.continue()
    const repeatFrequencyAndCountPage = Page.verifyOnPage(RepeatFrequencyAndCountPage)
    repeatFrequencyAndCountPage.selectFrequency('Every weekday (Monday to Friday)')
    repeatFrequencyAndCountPage.enterNumberOfAppointments('5')
    repeatFrequencyAndCountPage.back()
    Page.verifyOnPage(RepeatPage)
    repeatPage.back()
    checkAnswersPage.assertRepeat('No')

    checkAnswersPage.changeExtraInformation()
    Page.verifyOnPage(ExtraInformationPage)
    extraInformationPage.back()
    Page.verifyOnPage(CheckAnswersPage)

    checkAnswersPage.createAppointment()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.assertNoBackLink()
  })
})
