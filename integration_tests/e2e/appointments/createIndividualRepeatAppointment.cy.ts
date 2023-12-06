import { addDays, addMonths, addWeeks, format } from 'date-fns'
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
import getRepeatAppointmentSeriesDetails from '../../fixtures/activitiesApi/getRepeatAppointmentSeriesDetails.json'
import getRepeatAppointment1Details from '../../fixtures/activitiesApi/getRepeatAppointment1Details.json'
import getRepeatAppointment2Details from '../../fixtures/activitiesApi/getRepeatAppointment2Details.json'
import DateAndTimePage from '../../pages/appointments/create-and-edit/dateAndTimePage'
import RepeatPage from '../../pages/appointments/create-and-edit/repeatPage'
import RepeatFrequencyAndCountPage from '../../pages/appointments/create-and-edit/repeatFrequencyAndCountPage'
import CheckAnswersPage from '../../pages/appointments/create-and-edit/checkAnswersPage'
import ConfirmationPage from '../../pages/appointments/create-and-edit/confirmationPage'
import { formatDate } from '../../../server/utils/utils'
import AppointmentSeriesDetailsPage from '../../pages/appointments/appointment-series/appointmentSeriesDetailsPage'
import AppointmentDetailsPage from '../../pages/appointments/appointment/appointmentDetailsPage'
import AppointmentMovementSlipPage from '../../pages/appointments/appointment/appointmentMovementSlipPage'
import ExtraInformationPage from '../../pages/appointments/create-and-edit/extraInformationPage'
import SchedulePage from '../../pages/appointments/create-and-edit/schedulePage'
import TierPage from '../../pages/appointments/create-and-edit/tierPage'
import HostPage from '../../pages/appointments/create-and-edit/hostPage'

context('Individual repeat appointment', () => {
  const tomorrow = addDays(new Date(), 1)
  const tomorrowFormatted = formatDate(tomorrow, 'yyyy-MM-dd')
  const weekTomorrow = addWeeks(tomorrow, 1)
  const weekTomorrowFormatted = formatDate(weekTomorrow, 'yyyy-MM-dd')
  // To pass validation we must ensure the appointment details start date are set to the future
  getRepeatAppointmentSeriesDetails.startDate = tomorrowFormatted
  getRepeatAppointmentSeriesDetails.appointments[0].startDate = tomorrowFormatted
  getRepeatAppointmentSeriesDetails.appointments[1].startDate = weekTomorrowFormatted
  getRepeatAppointment1Details.startDate = tomorrowFormatted
  getRepeatAppointment2Details.startDate = weekTomorrowFormatted
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
    cy.stubEndpoint('GET', '/appointment-series/10/details', getRepeatAppointmentSeriesDetails)
    cy.stubEndpoint('GET', '/appointments/11/details', getRepeatAppointment1Details)
    cy.stubEndpoint('GET', '/appointments/12/details', getRepeatAppointment2Details)

    // Move through create individual appointment to repeat page
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

    const tierPage = Page.verifyOnPage(TierPage)
    tierPage.selectTier('Tier 2')
    tierPage.continue()

    const hostPage = Page.verifyOnPage(HostPage)
    hostPage.selectHost('Prison staff')
    hostPage.continue()

    const locationPage = Page.verifyOnPage(LocationPage)
    locationPage.selectLocation('Chapel')
    locationPage.continue()

    const dateAndTimePage = Page.verifyOnPage(DateAndTimePage)
    dateAndTimePage.enterStartDate(tomorrow)
    dateAndTimePage.selectStartTime(14, 0)
    dateAndTimePage.selectEndTime(15, 30)
    dateAndTimePage.continue()
  })

  context('Create appointment', () => {
    it('Should complete create individual repeat appointment journey', () => {
      const repeatPage = Page.verifyOnPage(RepeatPage)
      repeatPage.selectRepeat('Yes')
      repeatPage.continue()

      const repeatFrequencyAndCountPage = Page.verifyOnPage(RepeatFrequencyAndCountPage)
      repeatFrequencyAndCountPage.selectFrequency('Weekly')
      repeatFrequencyAndCountPage.enterNumberOfAppointments('2')
      repeatFrequencyAndCountPage.continue()

      const schedulePage = Page.verifyOnPage(SchedulePage)
      schedulePage.continue()

      const extraInformationPage = Page.verifyOnPage(ExtraInformationPage)
      extraInformationPage.continue()

      const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
      checkAnswersPage.assertRepeat('Yes')
      checkAnswersPage.assertFrequency('Weekly')
      checkAnswersPage.assertNumberOfAppointments('2')
      checkAnswersPage.createAppointment()

      const confirmationPage = Page.verifyOnPage(ConfirmationPage)
      confirmationPage.assertMessageEquals(
        `You have successfully scheduled an appointment for Stephen Gregs starting on ${formatDate(
          tomorrow,
          'EEEE, d MMMM yyyy',
        )}. It will repeat weekly for 2 appointments`,
      )

      confirmationPage.viewAppointmentLink().click()

      const appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
      appointmentDetailsPage.assertAppointmentSeriesDetails()
      appointmentDetailsPage.assertViewSeriesLink()
      appointmentDetailsPage.viewSeriesLink().click()

      const appointmentSeriesDetailsPage = Page.verifyOnPage(AppointmentSeriesDetailsPage)
      appointmentSeriesDetailsPage.assertAppointmentSeriesDetails()
      appointmentSeriesDetailsPage.assertFrequency('Weekly')
      appointmentSeriesDetailsPage.assertNumberOfAppointments('2')
      appointmentSeriesDetailsPage.assertAppointments(
        new Map([
          [1, formatDate(tomorrow, 'd MMMM yyyy')],
          [2, formatDate(weekTomorrow, 'd MMMM yyyy')],
        ]),
      )
      appointmentSeriesDetailsPage.assertCreatedBy('J. Smith')

      // View appointment
      appointmentSeriesDetailsPage.manageAppointmentLink(2).click()
      Page.verifyOnPage(AppointmentDetailsPage)
      appointmentDetailsPage.assertPrisonerSummary('Gregs, Stephen', 'A8644DY', '1-3')
      appointmentDetailsPage.assertName('Chaplaincy')
      appointmentDetailsPage.assertLocation('Chapel')
      appointmentDetailsPage.assertStartDate(weekTomorrow)
      appointmentDetailsPage.assertStartTime(14, 0)
      appointmentDetailsPage.assertEndTime(15, 30)
      appointmentDetailsPage.assertCreatedBy('J. Smith')
      appointmentDetailsPage.assertPrintMovementSlipLink()

      // Go back to appointment series details
      appointmentDetailsPage.viewSeriesLink().click()
      Page.verifyOnPage(AppointmentSeriesDetailsPage)

      // Print appointment movement slip
      appointmentSeriesDetailsPage.manageAppointmentLink(2).click()
      Page.verifyOnPage(AppointmentDetailsPage)

      appointmentDetailsPage.printMovementSlipLink().invoke('removeAttr', 'target')
      appointmentDetailsPage.printMovementSlipLink().click()

      const appointmentMovementSlipPage = Page.verifyOnPage(AppointmentMovementSlipPage)
      appointmentMovementSlipPage.assertExtraInformation('Appointment extra information')
      appointmentMovementSlipPage.assertPrisonerSummary('Stephen Gregs', 'A8644DY', 'MDI-1-3')
      appointmentMovementSlipPage.assertName('Chaplaincy')
      appointmentMovementSlipPage.assertLocation('Chapel')
      appointmentMovementSlipPage.assertStartDate(weekTomorrow)
      appointmentMovementSlipPage.assertStartTime(14, 0)
      appointmentMovementSlipPage.assertEndTime(15, 30)
      appointmentMovementSlipPage.assertExtraInformation('Appointment extra information')
    })

    it('Create individual repeat appointment - back links', () => {
      const repeatPage = Page.verifyOnPage(RepeatPage)
      repeatPage.selectRepeat('Yes')
      repeatPage.continue()

      const repeatFrequencyAndCountPage = Page.verifyOnPage(RepeatFrequencyAndCountPage)

      // Click through back links
      repeatFrequencyAndCountPage.back()
      Page.verifyOnPage(RepeatPage)
      repeatPage.assertRepeat('Yes')

      repeatPage.back()
      const dateAndTimePage = Page.verifyOnPage(DateAndTimePage)
      dateAndTimePage.assertStartDate(tomorrow)
      dateAndTimePage.assertStartTime(14, 0)
      dateAndTimePage.assertEndTime(15, 30)

      // Continue to repeat frequency and count page
      dateAndTimePage.continue()
      repeatPage.continue()

      Page.verifyOnPage(RepeatFrequencyAndCountPage)
      repeatFrequencyAndCountPage.selectFrequency('Daily (includes weekends)')
      repeatFrequencyAndCountPage.enterNumberOfAppointments('7')
      repeatFrequencyAndCountPage.continue()

      const schedulePage = Page.verifyOnPage(SchedulePage)
      schedulePage.continue()

      const extraInformationPage = Page.verifyOnPage(ExtraInformationPage)
      extraInformationPage.continue()

      const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
      checkAnswersPage.assertNoBackLink()

      // Back links from check answers
      checkAnswersPage.changeRepeat()
      Page.verifyOnPage(RepeatPage)
      dateAndTimePage.back()
      Page.verifyOnPage(CheckAnswersPage)

      checkAnswersPage.changeFrequency()
      Page.verifyOnPage(RepeatFrequencyAndCountPage)
      dateAndTimePage.back()
      Page.verifyOnPage(CheckAnswersPage)

      checkAnswersPage.changeNumberOfAppointments()
      Page.verifyOnPage(RepeatFrequencyAndCountPage)
      dateAndTimePage.back()
      Page.verifyOnPage(CheckAnswersPage)
    })

    it('Create individual repeat appointment - check answers change links', () => {
      const repeatPage = Page.verifyOnPage(RepeatPage)
      repeatPage.selectRepeat('No')
      repeatPage.continue()

      const schedulePage = Page.verifyOnPage(SchedulePage)
      schedulePage.continue()

      const extraInformationPage = Page.verifyOnPage(ExtraInformationPage)
      extraInformationPage.continue()

      const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
      checkAnswersPage.assertRepeat('No')

      // Start changing repeat from no to yes
      checkAnswersPage.changeRepeat()
      Page.verifyOnPage(RepeatPage)
      repeatPage.assertRepeat('No')
      repeatPage.selectRepeat('Yes')
      repeatPage.continue()

      const repeatFrequencyAndCountPage = Page.verifyOnPage(RepeatFrequencyAndCountPage)
      repeatFrequencyAndCountPage.selectFrequency('Every weekday (Monday to Friday)')
      repeatFrequencyAndCountPage.enterNumberOfAppointments('5')

      // Go back to change answer page and confirm that repeat is still 'No'
      repeatFrequencyAndCountPage.back()
      Page.verifyOnPage(RepeatPage)
      repeatPage.back()

      Page.verifyOnPage(CheckAnswersPage)
      checkAnswersPage.assertRepeat('No')

      // Complete changing repeat from no to yes
      checkAnswersPage.changeRepeat()
      Page.verifyOnPage(RepeatPage)
      repeatPage.assertRepeat('No')
      repeatPage.selectRepeat('Yes')
      repeatPage.continue()

      Page.verifyOnPage(RepeatFrequencyAndCountPage)
      repeatFrequencyAndCountPage.selectFrequency('Daily (includes weekends)')
      repeatFrequencyAndCountPage.enterNumberOfAppointments('7')
      repeatFrequencyAndCountPage.continue()

      Page.verifyOnPage(CheckAnswersPage)
      checkAnswersPage.assertRepeat('Yes')
      checkAnswersPage.assertFrequency('Daily (includes weekends)')
      checkAnswersPage.assertNumberOfAppointments('7')

      // Click to change repeat from yes but keep yes selected
      checkAnswersPage.changeRepeat()
      Page.verifyOnPage(RepeatPage)
      repeatPage.assertRepeat('Yes')
      repeatPage.selectRepeat('Yes')
      repeatPage.continue()
      Page.verifyOnPage(CheckAnswersPage)

      // Change repeat frequency and count
      checkAnswersPage.changeFrequency()
      Page.verifyOnPage(RepeatFrequencyAndCountPage)
      repeatFrequencyAndCountPage.assertFrequency('Daily (includes weekends)')
      repeatFrequencyAndCountPage.selectFrequency('Fortnightly')
      repeatFrequencyAndCountPage.continue()
      Page.verifyOnPage(CheckAnswersPage)
      checkAnswersPage.assertFrequency('Fortnightly')

      checkAnswersPage.changeNumberOfAppointments()
      Page.verifyOnPage(RepeatFrequencyAndCountPage)
      repeatFrequencyAndCountPage.assertNumberOfAppointments('7')
      repeatFrequencyAndCountPage.enterNumberOfAppointments('4')
      repeatFrequencyAndCountPage.continue()
      Page.verifyOnPage(CheckAnswersPage)
      checkAnswersPage.assertNumberOfAppointments('4')
    })
  })

  context('Verify appointment end date', () => {
    beforeEach(() => {
      const repeatPage = Page.verifyOnPage(RepeatPage)
      repeatPage.selectRepeat('Yes')
      repeatPage.continue()
    })

    describe('Every weekday', () => {
      it(`should display end date`, () => {
        const repeatFrequencyAndCountPage = Page.verifyOnPage(RepeatFrequencyAndCountPage)
        repeatFrequencyAndCountPage.selectFrequency('Every weekday')
        repeatFrequencyAndCountPage.enterNumberOfAppointments('1')
        repeatFrequencyAndCountPage.assertEndDate(format(tomorrow, 'EEEE, d MMMM yyyy'))
      })
    })

    describe('Daily', () => {
      it(`should display correct end date`, () => {
        const repeatFrequencyAndCountPage = Page.verifyOnPage(RepeatFrequencyAndCountPage)
        repeatFrequencyAndCountPage.selectFrequency('Daily')
        repeatFrequencyAndCountPage.enterNumberOfAppointments('3')
        repeatFrequencyAndCountPage.assertEndDate(format(addDays(tomorrow, 2), 'EEEE, d MMMM yyyy'))
      })
    })

    describe('Weekly', () => {
      it(`should display correct end date`, () => {
        const repeatFrequencyAndCountPage = Page.verifyOnPage(RepeatFrequencyAndCountPage)
        repeatFrequencyAndCountPage.selectFrequency('Weekly')
        repeatFrequencyAndCountPage.enterNumberOfAppointments('3')
        repeatFrequencyAndCountPage.assertEndDate(format(addWeeks(tomorrow, 2), 'EEEE, d MMMM yyyy'))
      })
    })

    describe('should display correct end date', () => {
      it(`should display correct end date`, () => {
        const repeatFrequencyAndCountPage = Page.verifyOnPage(RepeatFrequencyAndCountPage)
        repeatFrequencyAndCountPage.selectFrequency('Fortnightly')
        repeatFrequencyAndCountPage.enterNumberOfAppointments('3')
        repeatFrequencyAndCountPage.assertEndDate(format(addWeeks(tomorrow, 2 * 2), 'EEEE, d MMMM yyyy'))
      })
    })

    describe('Monthly', () => {
      it(`should display end date`, () => {
        const repeatFrequencyAndCountPage = Page.verifyOnPage(RepeatFrequencyAndCountPage)
        repeatFrequencyAndCountPage.selectFrequency('Monthly')
        repeatFrequencyAndCountPage.enterNumberOfAppointments('3')
        repeatFrequencyAndCountPage.assertEndDate(format(addMonths(tomorrow, 2), 'EEEE, d MMMM yyyy'))
      })
    })
  })
})
