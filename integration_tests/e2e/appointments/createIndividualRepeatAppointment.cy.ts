import { addDays, addWeeks } from 'date-fns'
import Page from '../../pages/page'
import IndexPage from '../../pages'
import AppointmentsManagementPage from '../../pages/appointments/appointmentsManagementPage'
import SelectPrisonerPage from '../../pages/appointments/create/selectPrisonerPage'
import CategoryPage from '../../pages/appointments/create/categoryPage'
import LocationPage from '../../pages/appointments/create/locationPage'
import postMatchPrisonerA8644DY from '../../fixtures/prisonerSearchApi/postMatchPrisonerA8644DY.json'
import getCategories from '../../fixtures/activitiesApi/getAppointmentCategories.json'
import getAppointmentLocations from '../../fixtures/prisonApi/getMdiAppointmentLocations.json'
import getAppointment from '../../fixtures/activitiesApi/getAppointment.json'
import getRepeatAppointmentDetails from '../../fixtures/activitiesApi/getRepeatAppointmentDetails.json'
import getOccurrenceDetails from '../../fixtures/activitiesApi/getOccurrenceDetails.json'
import DateAndTimePage from '../../pages/appointments/create/dateAndTimePage'
import RepeatPage from '../../pages/appointments/create/repeatPage'
import RepeatPeriodAndCountPage from '../../pages/appointments/create/repeatPeriodAndCountPage'
import CheckAnswersPage from '../../pages/appointments/create/checkAnswersPage'
import ConfirmationPage from '../../pages/appointments/create/confirmationPage'
import { formatDate } from '../../../server/utils/utils'
import AppointmentDetailsPage from '../../pages/appointments/details/appointmentDetails'
import OccurrenceDetailsPage from '../../pages/appointments/occurrenceDetails/occurrenceDetails'
import IndividualMovementSlip from '../../pages/appointments/movementSlip/individualMovementSlip'

context('Create individual repeat appointment', () => {
  const tomorrow = addDays(new Date(), 1)
  const weekTomorrow = addWeeks(tomorrow, 1)
  // To pass validation we must ensure the appointment details start date are set to the future
  getRepeatAppointmentDetails.startDate = formatDate(tomorrow, 'yyyy-MM-dd')
  getRepeatAppointmentDetails.occurrences[0].startDate = formatDate(tomorrow, 'yyyy-MM-dd')
  getRepeatAppointmentDetails.occurrences[1].startDate = formatDate(weekTomorrow, 'yyyy-MM-dd')
  getOccurrenceDetails.startDate = formatDate(weekTomorrow, 'yyyy-MM-dd')

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')
    cy.signIn()
    cy.stubEndpoint('POST', '/prisoner-search/match-prisoners', postMatchPrisonerA8644DY)
    cy.stubEndpoint('GET', '/appointment-categories', getCategories)
    cy.stubEndpoint('GET', '/api/agencies/MDI/locations\\?eventType=APP', getAppointmentLocations)
    cy.stubEndpoint('POST', '/appointments', getAppointment)
    cy.stubEndpoint('GET', '/appointment-details/10', getRepeatAppointmentDetails)
    cy.stubEndpoint('GET', '/appointment-occurrence-details/12', getOccurrenceDetails)

    // Move through create individual appointment to repeat page
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.createIndividualAppointmentCard().click()

    const selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.enterPrisonerNumber('A8644DY')
    selectPrisonerPage.continue()

    const categoryPage = Page.verifyOnPage(CategoryPage)
    categoryPage.selectCategory('Chaplaincy')
    categoryPage.continue()

    const locationPage = Page.verifyOnPage(LocationPage)
    locationPage.selectLocation('Chapel')
    locationPage.continue()

    const dateAndTimePage = Page.verifyOnPage(DateAndTimePage)
    dateAndTimePage.enterStartDate(tomorrow)
    dateAndTimePage.selectStartTime(14, 0)
    dateAndTimePage.selectEndTime(15, 30)
    dateAndTimePage.continue()
  })

  it('Should complete create individual repeat appointment journey', () => {
    const repeatPage = Page.verifyOnPage(RepeatPage)
    repeatPage.selectRepeat('Yes')
    repeatPage.continue()

    const repeatPeriodAndCountPage = Page.verifyOnPage(RepeatPeriodAndCountPage)
    repeatPeriodAndCountPage.selectRepeatPeriod('Weekly')
    repeatPeriodAndCountPage.enterRepeatCount('2')
    repeatPeriodAndCountPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertRepeat('Yes')
    checkAnswersPage.assertRepeatPeriod('Weekly')
    checkAnswersPage.assertRepeatCount('2')
    checkAnswersPage.createAppointment()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.assertMessageEquals(
      `You have successfully created an appointment for Stephen Gregs starting on ${formatDate(
        tomorrow,
        'EEEE d MMMM yyyy',
      )}. It will repeat weekly for 2 occurrences`,
    )

    confirmationPage.viewAppointmentLink().click()

    const appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
    appointmentDetailsPage.assertPrisonerSummary('Stephen Gregs', 'A8644DY', '1-3')
    appointmentDetailsPage.assertCategory('Chaplaincy')
    appointmentDetailsPage.assertLocation('Chapel')
    appointmentDetailsPage.assertStartDate(tomorrow)
    appointmentDetailsPage.assertStartTime(14, 0)
    appointmentDetailsPage.assertEndTime(15, 30)
    appointmentDetailsPage.assertRepeat('Yes')
    appointmentDetailsPage.assertRepeatPeriod('Weekly')
    appointmentDetailsPage.assertRepeatCount('2')
    appointmentDetailsPage.assertOccurrences(
      new Map([
        [1, formatDate(tomorrow, 'd MMM yyyy')],
        [2, formatDate(weekTomorrow, 'd MMM yyyy')],
      ]),
    )
    appointmentDetailsPage.assertCreatedBy('J. Smith')

    // View appointment occurrence
    appointmentDetailsPage.viewEditOccurrenceLink(2).click()
    const occurrenceDetailsPage = Page.verifyOnPage(OccurrenceDetailsPage)
    occurrenceDetailsPage.assertPrisonerSummary('Stephen Gregs', 'A8644DY', '1-3')
    occurrenceDetailsPage.assertCategory('Chaplaincy')
    occurrenceDetailsPage.assertLocation('Chapel')
    occurrenceDetailsPage.assertStartDate(weekTomorrow)
    occurrenceDetailsPage.assertStartTime(14, 0)
    occurrenceDetailsPage.assertEndTime(15, 30)
    occurrenceDetailsPage.assertCreatedBy('J. Smith')
    occurrenceDetailsPage.assertPrintMovementSlipLink()

    // Go back to appointment details
    occurrenceDetailsPage.back()
    Page.verifyOnPage(AppointmentDetailsPage)

    // Print occurrence movement slip
    appointmentDetailsPage.viewEditOccurrenceLink(2).click()
    Page.verifyOnPage(OccurrenceDetailsPage)

    occurrenceDetailsPage.printMovementSlipLink().invoke('removeAttr', 'target')
    occurrenceDetailsPage.printMovementSlipLink().click()

    const occurrenceMovementSlipPage = Page.verifyOnPage(IndividualMovementSlip)
    occurrenceMovementSlipPage.assertPrisonerSummary('Stephen Gregs', 'A8644DY', 'MDI-1-3')
    occurrenceMovementSlipPage.assertCategory('Chaplaincy')
    occurrenceMovementSlipPage.assertLocation('Chapel')
    occurrenceMovementSlipPage.assertStartDate(weekTomorrow)
    occurrenceMovementSlipPage.assertStartTime(14, 0)
    occurrenceMovementSlipPage.assertEndTime(15, 30)
    occurrenceMovementSlipPage.assertComments('Appointment occurrence level comment')
    occurrenceMovementSlipPage.assertCreatedBy('J. Smith')
  })

  it('Create individual repeat appointment - back links', () => {
    const repeatPage = Page.verifyOnPage(RepeatPage)
    repeatPage.selectRepeat('Yes')
    repeatPage.continue()

    const repeatPeriodAndCountPage = Page.verifyOnPage(RepeatPeriodAndCountPage)

    // Click through back links
    repeatPeriodAndCountPage.back()
    Page.verifyOnPage(RepeatPage)
    repeatPage.assertRepeat('Yes')

    repeatPage.back()
    const dateAndTimePage = Page.verifyOnPage(DateAndTimePage)
    dateAndTimePage.assertStartDate(tomorrow)
    dateAndTimePage.assertStartTime(14, 0)
    dateAndTimePage.assertEndTime(15, 30)

    // Continue to repeat period and count page
    dateAndTimePage.continue()
    repeatPage.continue()

    Page.verifyOnPage(RepeatPeriodAndCountPage)
    repeatPeriodAndCountPage.selectRepeatPeriod('Daily (includes weekends)')
    repeatPeriodAndCountPage.enterRepeatCount('7')
    repeatPeriodAndCountPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertNoBackLink()

    // Back links from check answers
    checkAnswersPage.changeRepeat()
    Page.verifyOnPage(RepeatPage)
    dateAndTimePage.back()
    Page.verifyOnPage(CheckAnswersPage)

    checkAnswersPage.changeRepeatPeriod()
    Page.verifyOnPage(RepeatPeriodAndCountPage)
    dateAndTimePage.back()
    Page.verifyOnPage(CheckAnswersPage)

    checkAnswersPage.changeRepeatCount()
    Page.verifyOnPage(RepeatPeriodAndCountPage)
    dateAndTimePage.back()
    Page.verifyOnPage(CheckAnswersPage)
  })

  it('Create individual repeat appointment - check answers change links', () => {
    const repeatPage = Page.verifyOnPage(RepeatPage)
    repeatPage.selectRepeat('No')
    repeatPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertRepeat('No')

    // Start changing repeat from no to yes
    checkAnswersPage.changeRepeat()
    Page.verifyOnPage(RepeatPage)
    repeatPage.assertRepeat('No')
    repeatPage.selectRepeat('Yes')
    repeatPage.continue()

    const repeatPeriodAndCountPage = Page.verifyOnPage(RepeatPeriodAndCountPage)
    repeatPeriodAndCountPage.selectRepeatPeriod('Every weekday (Monday to Friday)')
    repeatPeriodAndCountPage.enterRepeatCount('5')

    // Go back to change answer page and confirm that repeat is still 'No'
    repeatPeriodAndCountPage.back()
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

    Page.verifyOnPage(RepeatPeriodAndCountPage)
    repeatPeriodAndCountPage.selectRepeatPeriod('Daily (includes weekends)')
    repeatPeriodAndCountPage.enterRepeatCount('7')
    repeatPeriodAndCountPage.continue()

    Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertRepeat('Yes')
    checkAnswersPage.assertRepeatPeriod('Daily (includes weekends)')
    checkAnswersPage.assertRepeatCount('7')

    // Click to change repeat from yes but keep yes selected
    checkAnswersPage.changeRepeat()
    Page.verifyOnPage(RepeatPage)
    repeatPage.assertRepeat('Yes')
    repeatPage.selectRepeat('Yes')
    repeatPage.continue()
    Page.verifyOnPage(CheckAnswersPage)

    // Change repeat period and count
    checkAnswersPage.changeRepeatPeriod()
    Page.verifyOnPage(RepeatPeriodAndCountPage)
    repeatPeriodAndCountPage.assertRepeatPeriod('Daily (includes weekends)')
    repeatPeriodAndCountPage.selectRepeatPeriod('Fortnightly')
    repeatPeriodAndCountPage.continue()
    Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertRepeatPeriod('Fortnightly')

    checkAnswersPage.changeRepeatCount()
    Page.verifyOnPage(RepeatPeriodAndCountPage)
    repeatPeriodAndCountPage.assertRepeatCount('7')
    repeatPeriodAndCountPage.enterRepeatCount('4')
    repeatPeriodAndCountPage.continue()
    Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertRepeatCount('4')
  })
})
