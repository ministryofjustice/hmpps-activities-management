import { addDays } from 'date-fns'
import Page from '../../pages/page'
import IndexPage from '../../pages'
import AppointmentsManagementPage from '../../pages/appointments/appointmentsManagementPage'
import SelectPrisonerPage from '../../pages/appointments/create-and-edit/selectPrisonerPage'
import CategoryPage from '../../pages/appointments/create-and-edit/categoryPage'
import DescriptionPage from '../../pages/appointments/create-and-edit/descriptionPage'
import LocationPage from '../../pages/appointments/create-and-edit/locationPage'
import getPrisonPrisoners from '../../fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A8644DY.json'
import getCategories from '../../fixtures/activitiesApi/getAppointmentCategories.json'
import getAppointmentLocations from '../../fixtures/prisonApi/getMdiAppointmentLocations.json'
import getAppointment from '../../fixtures/activitiesApi/getAppointment.json'
import getAppointmentDetails from '../../fixtures/activitiesApi/getAppointmentDetails.json'
import getOccurrenceDetails from '../../fixtures/activitiesApi/getOccurrenceDetails.json'
import DateAndTimePage from '../../pages/appointments/create-and-edit/dateAndTimePage'
import RepeatPage from '../../pages/appointments/create-and-edit/repeatPage'
import CheckAnswersPage from '../../pages/appointments/create-and-edit/checkAnswersPage'
import ConfirmationPage from '../../pages/appointments/create-and-edit/confirmationPage'
import IndividualMovementSlip from '../../pages/appointments/movementSlip/individualMovementSlip'
import { formatDate } from '../../../server/utils/utils'
import OccurrenceDetailsPage from '../../pages/appointments/occurrenceDetails/occurrenceDetails'

context('Create individual appointment', () => {
  const tomorrow = addDays(new Date(), 1)
  // To pass validation we must ensure the appointment details start date are set to tomorrow
  getAppointmentDetails.startDate = formatDate(tomorrow, 'yyyy-MM-dd')
  getOccurrenceDetails.startDate = formatDate(tomorrow, 'yyyy-MM-dd')

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')
    cy.signIn()
    cy.stubEndpoint('GET', '/prison/MDI/prisoners\\?term=A8644DY', getPrisonPrisoners)
    cy.stubEndpoint('GET', '/appointment-categories', getCategories)
    cy.stubEndpoint('GET', '/appointment-locations/MDI', getAppointmentLocations)
    cy.stubEndpoint('POST', '/appointments', getAppointment)
    cy.stubEndpoint('GET', '/appointment-details/10', getAppointmentDetails)
    cy.stubEndpoint('GET', '/appointment-occurrence-details/11', getOccurrenceDetails)
  })

  it('Should complete create individual appointment journey', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().should('contain.text', 'Appointments management')
    indexPage
      .appointmentsManagementCard()
      .should('contain.text', 'Create and manage appointments for individuals and groups.')
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.createIndividualAppointmentCard().should('contain.text', 'Create an appointment')
    appointmentsManagementPage
      .createIndividualAppointmentCard()
      .should('contain.text', 'Create an appointment for an individual prisoner in your prison.')
    appointmentsManagementPage.createIndividualAppointmentCard().click()

    const selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.enterPrisonerNumber('A8644DY')
    selectPrisonerPage.continue()

    const categoryPage = Page.verifyOnPage(CategoryPage)
    categoryPage.selectCategory('Chaplaincy')
    categoryPage.continue()

    const descriptionPage = Page.verifyOnPage(DescriptionPage)
    descriptionPage.descriptionOption('Yes')
    descriptionPage.continue()

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

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertPrisonerSummary('Stephen Gregs', 'A8644DY', '1-3')
    checkAnswersPage.assertCategory('Chaplaincy')
    checkAnswersPage.assertLocation('Chapel')
    checkAnswersPage.assertStartDate(tomorrow)
    checkAnswersPage.assertStartTime(14, 0)
    checkAnswersPage.assertEndTime(15, 30)
    checkAnswersPage.assertRepeat('No')
    checkAnswersPage.createAppointment()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.assertMessageEquals(
      `You have successfully created an appointment for Stephen Gregs on ${formatDate(tomorrow, 'EEEE d MMMM yyyy')}.`,
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

    const individualMovementSlipPage = Page.verifyOnPage(IndividualMovementSlip)
    individualMovementSlipPage.assertPrisonerSummary('Stephen Gregs', 'A8644DY', 'MDI-1-3')
    individualMovementSlipPage.assertCategory('Chaplaincy')
    individualMovementSlipPage.assertLocation('Chapel')
    individualMovementSlipPage.assertStartDate(tomorrow)
    individualMovementSlipPage.assertStartTime(14, 0)
    individualMovementSlipPage.assertEndTime(15, 30)
    individualMovementSlipPage.assertComments('Appointment level comment')
    individualMovementSlipPage.assertCreatedBy('J. Smith')
  })
})
