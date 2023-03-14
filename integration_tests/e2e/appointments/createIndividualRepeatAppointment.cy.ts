import { addDays } from 'date-fns'
import Page from '../../pages/page'
import IndexPage from '../../pages'
import AppointmentsManagementPage from '../../pages/appointments/appointmentsManagementPage'
import SelectPrisonerPage from '../../pages/appointments/createSingle/selectPrisonerPage'
import CategoryPage from '../../pages/appointments/createSingle/categoryPage'
import LocationPage from '../../pages/appointments/createSingle/locationPage'
import postMatchPrisonerA8644DY from '../../fixtures/prisonerSearchApi/postMatchPrisonerA8644DY.json'
import getCategories from '../../fixtures/activitiesApi/getAppointmentCategories.json'
import getAppointmentLocations from '../../fixtures/prisonApi/getMdiAppointmentLocations.json'
import getAppointment from '../../fixtures/activitiesApi/getAppointment.json'
import getAppointmentDetails from '../../fixtures/activitiesApi/getAppointmentDetails.json'
import DateAndTimePage from '../../pages/appointments/createSingle/dateAndTimePage'
import RepeatPage from '../../pages/appointments/createSingle/repeatPage'
import RepeatPeriodAndCountPage from '../../pages/appointments/createSingle/repeatPeriodAndCountPage'
import CheckAnswersPage from '../../pages/appointments/createSingle/checkAnswersPage'
import ConfirmationPage from '../../pages/appointments/createSingle/confirmationPage'
import { formatDate } from '../../../server/utils/utils'

context('Create individual repeat appointment', () => {
  const tomorrow = addDays(new Date(), 1)
  // To pass validation we must ensure the appointment details start date are set to tomorrow
  getAppointmentDetails.startDate = formatDate(tomorrow, 'yyyy-MM-dd')

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')
    cy.signIn()
    cy.stubEndpoint('POST', '/prisoner-search/match-prisoners', postMatchPrisonerA8644DY)
    cy.stubEndpoint('GET', '/appointment-categories', getCategories)
    cy.stubEndpoint('GET', '/api/agencies/MDI/locations\\?eventType=APP', getAppointmentLocations)
    cy.stubEndpoint('POST', '/appointments', getAppointment)
    cy.stubEndpoint('GET', '/appointment-details/10', getAppointmentDetails)

    // Move through create individual appointment to repeat page
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.createSingleAppointmentCard().click()

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
    repeatPeriodAndCountPage.selectRepeatPeriod('Every weekday (Monday to Friday)')
    repeatPeriodAndCountPage.enterRepeatCount('10')
    repeatPeriodAndCountPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertRepeat('Yes')
    checkAnswersPage.assertRepeatPeriod('Every weekday (Monday to Friday)')
    checkAnswersPage.assertRepeatCount('10')
    checkAnswersPage.createAppointment()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.assertMessageEquals(
      `You have successfully created an appointment for Stephen Gregs starting on ${formatDate(
        tomorrow,
        'EEEE d MMMM yyyy',
      )}. It will repeat every weekday (Monday to Friday) for 10 occurrences`,
    )
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
    dateAndTimePage.selectStartTime(15, 5)

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
    repeatPeriodAndCountPage.selectRepeatPeriod('Weekly')
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
