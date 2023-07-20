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
import getAppointment from '../../fixtures/activitiesApi/getAppointment.json'
import getAppointmentDetails from '../../fixtures/activitiesApi/getAppointmentDetails.json'
import getOccurrenceDetails from '../../fixtures/activitiesApi/getOccurrenceDetails.json'
import DateAndTimePage from '../../pages/appointments/create-and-edit/dateAndTimePage'
import RepeatPage from '../../pages/appointments/create-and-edit/repeatPage'
import CheckAnswersPage from '../../pages/appointments/create-and-edit/checkAnswersPage'
import ConfirmationPage from '../../pages/appointments/create-and-edit/confirmationPage'
import OccurrenceMovementSlip from '../../pages/appointments/movementSlip/occurrenceMovementSlip'
import { formatDate } from '../../../server/utils/utils'
import OccurrenceDetailsPage from '../../pages/appointments/occurrenceDetails/occurrenceDetails'
import CommentPage from '../../pages/appointments/create-and-edit/commentPage'
import SchedulePage from '../../pages/appointments/create-and-edit/schedulePage'

context('Create individual appointment', () => {
  const tomorrow = addDays(new Date(), 1)
  const tomorrowFormatted = formatDate(tomorrow, 'yyyy-MM-dd')
  // To pass validation we must ensure the appointment details start date is set to tomorrow
  getAppointmentDetails.startDate = tomorrowFormatted
  getAppointmentDetails.occurrences[0].startDate = getAppointmentDetails.startDate
  getOccurrenceDetails.startDate = tomorrowFormatted
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
    cy.stubEndpoint('POST', '/appointments', getAppointment)
    cy.stubEndpoint('GET', '/appointment-details/10', getAppointmentDetails)
    cy.stubEndpoint('GET', '/appointment-occurrence-details/11', getOccurrenceDetails)
  })

  it('Should complete create individual appointment journey', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().should('contain.text', 'Schedule and edit appointments')
    indexPage
      .appointmentsManagementCard()
      .should(
        'contain.text',
        'Create one-to-one and group appointments. Edit existing appointments and print movement slips.',
      )
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

    const commentPage = Page.verifyOnPage(CommentPage)
    commentPage.enterComment('Appointment level comment')
    commentPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertPrisonerSummary('Stephen Gregs', 'A8644DY', '1-3')
    checkAnswersPage.assertCategory('Chaplaincy')
    checkAnswersPage.assertLocation('Chapel')
    checkAnswersPage.assertStartDate(tomorrow)
    checkAnswersPage.assertStartTime(14, 0)
    checkAnswersPage.assertEndTime(15, 30)
    checkAnswersPage.assertRepeat('No')
    checkAnswersPage.assertComment('Appointment level comment')
    checkAnswersPage.createAppointment()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.assertMessageEquals(
      `You have successfully scheduled an appointment for Stephen Gregs on ${formatDate(
        tomorrow,
        'EEEE, d MMMM yyyy',
      )}.`,
    )
    confirmationPage.assertCreateAnotherLinkExists()
    confirmationPage.assertViewAppointmentLinkExists()

    confirmationPage.viewAppointmentLink().click()

    const appointmentDetailsPage = Page.verifyOnPage(OccurrenceDetailsPage)
    appointmentDetailsPage.assertNoAppointmentSeriesDetails()
    appointmentDetailsPage.assertCategory('Chaplaincy')
    appointmentDetailsPage.assertLocation('Chapel')
    appointmentDetailsPage.assertStartDate(tomorrow)
    appointmentDetailsPage.assertStartTime(14, 0)
    appointmentDetailsPage.assertEndTime(15, 30)
    appointmentDetailsPage.assertPrisonerSummary('Gregs, Stephen', 'A8644DY', '1-3')
    appointmentDetailsPage.assertCreatedBy('J. Smith')
    appointmentDetailsPage.assertPrintMovementSlipLink()

    appointmentDetailsPage.printMovementSlipLink().invoke('removeAttr', 'target')
    appointmentDetailsPage.printMovementSlipLink().click()

    const individualMovementSlipPage = Page.verifyOnPage(OccurrenceMovementSlip)
    individualMovementSlipPage.assertPrisonerSummary('Stephen Gregs', 'A8644DY', 'MDI-1-3')
    individualMovementSlipPage.assertCategory('Chaplaincy')
    individualMovementSlipPage.assertLocation('Chapel')
    individualMovementSlipPage.assertStartDate(tomorrow)
    individualMovementSlipPage.assertStartTime(14, 0)
    individualMovementSlipPage.assertEndTime(15, 30)
    individualMovementSlipPage.assertComments('Appointment occurrence level comment')
  })
})
