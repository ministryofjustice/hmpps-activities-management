import { addDays, subDays } from 'date-fns'
import Page from '../../pages/page'
import IndexPage from '../../pages'
import getCategories from '../../fixtures/activitiesApi/getAppointmentCategories.json'
import getAppointmentLocations from '../../fixtures/prisonApi/getMdiAppointmentLocations.json'
import getAppointmentSearchResults from '../../fixtures/activitiesApi/getAppointmentSearchResults.json'
import postPrisonerNumbers from '../../fixtures/prisonerSearchApi/postPrisonerNumbers-A1350DZ-A8644DY-A1351DZ.json'
import AppointmentsManagementPage from '../../pages/appointments/appointmentsManagementPage'
import SearchSelectDatePage from '../../pages/appointments/appointment/searchSelectDatePage'
import SearchResultsPage from '../../pages/appointments/appointment/appointmentsSearchResultsPage'
import getGroupAppointmentDetails from '../../fixtures/activitiesApi/getGroupAppointmentDetails.json'
import AppointmentDetailsPage from '../../pages/appointments/appointment/appointmentDetailsPage'
import CopySummaryPage from '../../pages/appointments/appointment/copySummaryPage'
import ReviewPrisonersPage from '../../pages/appointments/create-and-edit/reviewPrisonersPage'
import DateAndTimePage from '../../pages/appointments/create-and-edit/dateAndTimePage'
import SchedulePage from '../../pages/appointments/create-and-edit/schedulePage'
import getGroupAppointmentSeriesDetails from '../../fixtures/activitiesApi/getGroupAppointmentSeriesDetails.json'
import getOffenderAlerts from '../../fixtures/activitiesApi/getOffenderAlerts.json'
import getScheduledEvents from '../../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import { formatDate } from '../../../server/utils/utils'
import CheckAnswersPage from '../../pages/appointments/create-and-edit/checkAnswersPage'
import getAppointmentSeries from '../../fixtures/activitiesApi/getAppointmentSeries.json'
import ConfirmationPage from '../../pages/appointments/create-and-edit/confirmationPage'
import CopySeriesPage from '../../pages/appointments/create-and-edit/copySeriesPage'
import NoAttendeesPage from '../../pages/appointments/create-and-edit/noAttendeesPage'
import HowToAddPrisonersPage from '../../pages/appointments/create-and-edit/howToAddPrisonersPage'
import ReviewPrisonerAlertsPage, {
  arsonistBadge,
  catABadge,
  corruptorBadge,
  noOneToOneBadge,
  tactBadge,
} from '../../pages/appointments/create-and-edit/reviewPrisonerAlertsPage'
import SelectPrisonerPage from '../../pages/appointments/create-and-edit/selectPrisonerPage'
import getPrisonPrisoners from '../../fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A8644DY.json'
import getPrisonerA8644DY from '../../fixtures/prisonerSearchApi/getPrisoner-MDI-A8644DY.json'

context('Duplicate appointment', () => {
  const tomorrow = addDays(new Date(), 1)
  const tomorrowFormatted = formatDate(tomorrow, 'yyyy-MM-dd')

  getGroupAppointmentSeriesDetails.startDate = tomorrowFormatted
  getGroupAppointmentSeriesDetails.appointments[0].startDate = getGroupAppointmentSeriesDetails.startDate
  getGroupAppointmentDetails.startDate = tomorrowFormatted

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
    cy.stubEndpoint('GET', '/appointment-categories', getCategories)
    cy.stubEndpoint('GET', '/appointment-locations/MDI', getAppointmentLocations)
    cy.stubEndpoint('POST', '/appointments/MDI/search', getAppointmentSearchResults)
    cy.stubEndpoint('GET', '/users/jsmith', JSON.parse('{"name": "John Smith", "username": "jsmith"}'))
    cy.stubEndpoint('GET', '/appointment-series/10/details', getGroupAppointmentSeriesDetails)
    cy.stubEndpoint('POST', '/api/bookings/offenderNo/MDI/alerts', getOffenderAlerts)
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${tomorrowFormatted}`, getScheduledEvents)
    cy.stubEndpoint('POST', '/appointment-series', getAppointmentSeries)
  })

  context('Single', () => {
    it('Should be able to duplicate a single appointment', () => {
      postPrisonerNumbers[0].status = 'ACTIVE_IN'
      postPrisonerNumbers[1].inOutStatus = 'IN'

      cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', postPrisonerNumbers)
      cy.stubEndpoint('GET', '/appointments/11/details', getGroupAppointmentDetails)

      Page.verifyOnPage(IndexPage).appointmentsManagementCard().click()

      Page.verifyOnPage(AppointmentsManagementPage).searchAppointmentsCard().click()

      const searchSelectDatePage = Page.verifyOnPage(SearchSelectDatePage)
      searchSelectDatePage.selectDatePickerDate(tomorrow)
      searchSelectDatePage.continue()

      verifySearchResults()

      const originalAppointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
      originalAppointmentDetailsPage.copyAppointmentLink().click()

      const copySummaryPage = Page.verifyOnPage(CopySummaryPage)
      // cancel and return to original appointment
      copySummaryPage.firstParagraphText(
        `This will create a new appointment, using the details of ${getGroupAppointmentDetails.appointmentName} from ${formatDate(tomorrow, 'EEEE, d MMMM yyyy')}. It will have the same:`,
      )
      copySummaryPage.cancelLink().click()

      originalAppointmentDetailsPage.copyAppointmentLink().click()

      copySummaryPage.continue()

      const reviewPrisonersPage = Page.verifyOnPage(ReviewPrisonersPage)
      reviewPrisonersPage.continue()

      verifyAlerts()

      const dateAndTimePage = Page.verifyOnPage(DateAndTimePage)
      dateAndTimePage.selectDatePickerDate(tomorrow)
      dateAndTimePage.continue()

      const schedulePage = Page.verifyOnPage(SchedulePage)
      schedulePage.continue()

      verifyCheckAnswers((checkAnswersPage: CheckAnswersPage) => {
        checkAnswersPage.assertRepeat('No')
      })

      const confirmationPage = Page.verifyOnPage(ConfirmationPage)
      const successMessage = `You have successfully scheduled an appointment for 3 people on ${formatDate(
        tomorrow,
        'EEEE, d MMMM yyyy',
      )}.`
      confirmationPage.assertMessageEquals(successMessage)
      confirmationPage.assertCreateAnotherLinkExists()
      confirmationPage.assertViewAppointmentLinkExists()

      confirmationPage.viewAppointmentLink().click()

      verifyNewAppointment((appointmentDetailsPage: AppointmentDetailsPage) => {
        appointmentDetailsPage.assertNoAppointmentSeriesDetails()
      })
    })
  })

  context('Repeat', () => {
    beforeEach(() => {
      getGroupAppointmentDetails.appointmentSeries = {
        id: 10,
        schedule: {
          frequency: 'WEEKLY',
          numberOfAppointments: 4,
        },
        appointmentCount: 4,
        scheduledAppointmentCount: 4,
      }

      cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', postPrisonerNumbers)
      cy.stubEndpoint('GET', '/appointments/11/details', getGroupAppointmentDetails)
    })

    it('Duplicate series', () => {
      Page.verifyOnPage(IndexPage).appointmentsManagementCard().click()

      Page.verifyOnPage(AppointmentsManagementPage).searchAppointmentsCard().click()

      const searchSelectDatePage = Page.verifyOnPage(SearchSelectDatePage)
      searchSelectDatePage.selectDatePickerDate(tomorrow)
      searchSelectDatePage.continue()

      verifySearchResults()

      const originalAppointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
      originalAppointmentDetailsPage.copyAppointmentLink().click()

      const copySummaryPage = Page.verifyOnPage(CopySummaryPage)
      copySummaryPage.firstParagraphText(
        `This will create a new appointment, using the details of ${getGroupAppointmentDetails.appointmentName} from ${formatDate(tomorrow, 'EEEE, d MMMM yyyy')}. It will have the same:`,
      )
      copySummaryPage.continue()

      const reviewPrisonersPage = Page.verifyOnPage(ReviewPrisonersPage)
      reviewPrisonersPage.continue()

      verifyAlerts()

      const dateAndTimePage = Page.verifyOnPage(DateAndTimePage)
      dateAndTimePage.selectDatePickerDate(tomorrow)
      dateAndTimePage.continue()

      const copySeriesPage = Page.verifyOnPage(CopySeriesPage)
      copySeriesPage.seriesAppointment().click()
      copySeriesPage.continue()

      const schedulePage = Page.verifyOnPage(SchedulePage)
      schedulePage.continue()

      verifyCheckAnswers((checkAnswersPage: CheckAnswersPage) => {
        checkAnswersPage.assertRepeat('Yes')
        checkAnswersPage.assertFrequency('Weekly')
        checkAnswersPage.assertNumberOfAppointments('4')
      })

      const confirmationPage = Page.verifyOnPage(ConfirmationPage)
      const successMessage = `You have successfully scheduled an appointment for 3 people starting on ${formatDate(
        tomorrow,
        'EEEE, d MMMM yyyy',
      )}. It will repeat weekly for 4 appointments`
      confirmationPage.assertMessageEquals(successMessage)
      confirmationPage.assertCreateAnotherLinkExists()
      confirmationPage.assertViewAppointmentLinkExists()

      confirmationPage.viewAppointmentLink().click()

      verifyNewAppointment((appointmentDetailsPage: AppointmentDetailsPage) => {
        appointmentDetailsPage.assertAppointmentSeriesDetails()
        appointmentDetailsPage.assertSeriesFrequency('Weekly')
        appointmentDetailsPage.assertSeriesSequence('2 of 4')
      })
    })

    it('Duplicate single appointment', () => {
      Page.verifyOnPage(IndexPage).appointmentsManagementCard().click()

      Page.verifyOnPage(AppointmentsManagementPage).searchAppointmentsCard().click()

      const searchSelectDatePage = Page.verifyOnPage(SearchSelectDatePage)
      searchSelectDatePage.selectDatePickerDate(tomorrow)
      searchSelectDatePage.continue()

      verifySearchResults()

      const originalAppointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
      originalAppointmentDetailsPage.copyAppointmentLink().click()

      const copySummaryPage = Page.verifyOnPage(CopySummaryPage)
      copySummaryPage.firstParagraphText(
        `This will create a new appointment, using the details of ${getGroupAppointmentDetails.appointmentName} from ${formatDate(tomorrow, 'EEEE, d MMMM yyyy')}. It will have the same:`,
      )
      copySummaryPage.continue()

      const reviewPrisonersPage = Page.verifyOnPage(ReviewPrisonersPage)
      reviewPrisonersPage.continue()

      verifyAlerts()

      const dateAndTimePage = Page.verifyOnPage(DateAndTimePage)
      dateAndTimePage.selectDatePickerDate(tomorrow)
      dateAndTimePage.continue()

      const copySeriesPage = Page.verifyOnPage(CopySeriesPage)
      copySeriesPage.oneOffAppointment().click()
      copySeriesPage.continue()

      const schedulePage = Page.verifyOnPage(SchedulePage)
      schedulePage.continue()

      verifyCheckAnswers((checkAnswersPage: CheckAnswersPage) => {
        checkAnswersPage.assertRepeat('No')
      })

      const confirmationPage = Page.verifyOnPage(ConfirmationPage)
      const successMessage = `You have successfully scheduled an appointment for 3 people starting on ${formatDate(
        tomorrow,
        'EEEE, d MMMM yyyy',
      )}. It will repeat weekly for 4 appointments`
      confirmationPage.assertMessageEquals(successMessage)
      confirmationPage.assertCreateAnotherLinkExists()
      confirmationPage.assertViewAppointmentLinkExists()

      confirmationPage.viewAppointmentLink().click()

      verifyNewAppointment((appointmentDetailsPage: AppointmentDetailsPage) => {
        appointmentDetailsPage.assertAppointmentSeriesDetails()
        appointmentDetailsPage.assertSeriesFrequency('Weekly')
        appointmentDetailsPage.assertSeriesSequence('2 of 4')
      })
    })
  })

  context('No prisoners copied', () => {
    const yesterday = subDays(new Date(), 1)
    const yesterdayFormatted = formatDate(yesterday, 'yyyy-MM-dd')

    beforeEach(() => {
      getGroupAppointmentDetails.appointmentSeries = {
        id: 10,
      }

      postPrisonerNumbers[0].status = 'INACTIVE OUT'
      postPrisonerNumbers[0].confirmedReleaseDate = yesterdayFormatted
      postPrisonerNumbers[0].lastMovementTypeCode = 'REL'

      postPrisonerNumbers[1].inOutStatus = 'OUT'
      postPrisonerNumbers[1].prisonId = 'RSI'

      const newPostPrisonerNumbers = postPrisonerNumbers.slice(0, 2)

      cy.stubEndpoint('GET', '/appointments/11/details', getGroupAppointmentDetails)
      cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', newPostPrisonerNumbers)
      cy.stubEndpoint('GET', '/prison/MDI/prisoners\\?term=A8644DY&size=50', getPrisonPrisoners)
      cy.stubEndpoint('GET', '/prisoner/A8644DY', getPrisonerA8644DY)
    })

    it('Should be able to copy appointment', () => {
      Page.verifyOnPage(IndexPage).appointmentsManagementCard().click()

      Page.verifyOnPage(AppointmentsManagementPage).searchAppointmentsCard().click()

      const searchSelectDatePage = Page.verifyOnPage(SearchSelectDatePage)
      searchSelectDatePage.selectDatePickerDate(tomorrow)
      searchSelectDatePage.continue()

      verifySearchResults()

      const originalAppointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
      originalAppointmentDetailsPage.copyAppointmentLink().click()

      const copySummaryPage = Page.verifyOnPage(CopySummaryPage)
      copySummaryPage.firstParagraphText(
        `This will create a new appointment, using the details of ${getGroupAppointmentDetails.appointmentName} from ${formatDate(tomorrow, 'EEEE, d MMMM yyyy')}. It will have the same:`,
      )
      copySummaryPage.continue()

      const noAttendeesPage = Page.verifyOnPage(NoAttendeesPage)
      noAttendeesPage.summaryText(
        `Attendees from ${getGroupAppointmentDetails.appointmentName} on ${formatDate(tomorrow, 'EEEE, d MMMM yyyy')} have left Moorland.`,
      )
      noAttendeesPage.addSomeoneToTheListButton().click()

      const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
      howToAddPrisonersPage.selectOneByOne()
      howToAddPrisonersPage.continue()

      const selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
      selectPrisonerPage.enterPrisonerNumber('A8644DY')
      selectPrisonerPage.searchButton().click()

      Page.verifyOnPage(SelectPrisonerPage)
      selectPrisonerPage.continueButton().click()

      const reviewPrisonersPage = Page.verifyOnPage(ReviewPrisonersPage)
      reviewPrisonersPage.assertPrisonerInList('Gregs, Stephen')
      reviewPrisonersPage.continue()

      const dateAndTimePage = Page.verifyOnPage(DateAndTimePage)
      dateAndTimePage.selectDatePickerDate(tomorrow)
      dateAndTimePage.continue()

      const schedulePage = Page.verifyOnPage(SchedulePage)
      schedulePage.continue()

      const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
      checkAnswersPage.assertPrisonerInList('Gregs, Stephen', 'A8644DY')
      checkAnswersPage.assertCategory('Chaplaincy')
      checkAnswersPage.assertTier('Tier 2')
      checkAnswersPage.assertHost('Prison staff')
      checkAnswersPage.assertLocation('Chapel')
      checkAnswersPage.assertStartDate(tomorrow)
      checkAnswersPage.assertStartTime(14, 0)
      checkAnswersPage.assertEndTime(15, 30)
      checkAnswersPage.createAppointment()

      const confirmationPage = Page.verifyOnPage(ConfirmationPage)
      const successMessage = `You have successfully scheduled an appointment for 3 people on ${formatDate(
        tomorrow,
        'EEEE, d MMMM yyyy',
      )}.`
      confirmationPage.assertMessageEquals(successMessage)
      confirmationPage.assertCreateAnotherLinkExists()
      confirmationPage.assertViewAppointmentLinkExists()

      confirmationPage.viewAppointmentLink().click()

      verifyNewAppointment((appointmentDetailsPage: AppointmentDetailsPage) => {
        appointmentDetailsPage.assertNoAppointmentSeriesDetails()
      })
    })
  })

  const verifySearchResults = () => {
    const searchResultsDatePage = Page.verifyOnPage(SearchResultsPage)
    searchResultsDatePage.assertResultsLocation(0, getAppointmentSearchResults[0].internalLocation.description)
    searchResultsDatePage.assertResultsLocation(1, 'In cell')
    searchResultsDatePage.viewLink(0).click()
  }

  const verifyAlerts = () => {
    const reviewPrisonerAlertsPage = Page.verifyOnPage(ReviewPrisonerAlertsPage)
    reviewPrisonerAlertsPage.assertPrisonerInList('Lee Jacobson')
    reviewPrisonerAlertsPage.assertBadges(arsonistBadge, catABadge, corruptorBadge, noOneToOneBadge, tactBadge)
    reviewPrisonerAlertsPage.assertAlertDescriptions(
      'Arsonist',
      'Corruptor',
      'No 1 to 1 with this prisoner',
      'Terrorism Act or Related Offence',
    )
    reviewPrisonerAlertsPage.continue()
  }

  const verifyCheckAnswers = (checkRepeats: (checkAnswersPage: CheckAnswersPage) => void) => {
    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertPrisonerInList('Winchurch, David', 'A1350DZ')
    checkAnswersPage.assertPrisonerInList('Gregs, Stephen', 'A8644DY')
    checkAnswersPage.assertPrisonerInList('Jacobson, Lee', 'A1351DZ')
    checkAnswersPage.assertCategory('Chaplaincy')
    checkAnswersPage.assertTier('Tier 2')
    checkAnswersPage.assertHost('Prison staff')
    checkAnswersPage.assertLocation('Chapel')
    checkAnswersPage.assertStartDate(tomorrow)
    checkAnswersPage.assertStartTime(14, 0)
    checkAnswersPage.assertEndTime(15, 30)
    checkRepeats(checkAnswersPage)
    checkAnswersPage.createAppointment()
  }

  const verifyNewAppointment = (verifySeries: (appointmentDetailsPage: AppointmentDetailsPage) => void) => {
    const newAppointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
    verifySeries(newAppointmentDetailsPage)
    newAppointmentDetailsPage.assertName('Chaplaincy')
    newAppointmentDetailsPage.assertLocation('Chapel')
    newAppointmentDetailsPage.assertStartDate(tomorrow)
    newAppointmentDetailsPage.assertStartTime(14, 0)
    newAppointmentDetailsPage.assertEndTime(15, 30)
    newAppointmentDetailsPage.assertPrisonerSummary('Gregs, Stephen', 'A8644DY', '1-3')
    newAppointmentDetailsPage.assertPrisonerSummary('Winchurch, David', 'A1350DZ', '2-2-024')
    newAppointmentDetailsPage.assertPrisonerSummary('Jacobson, Lee', 'A1351DZ', '1')

    newAppointmentDetailsPage.assertCreatedBy('J. Smith')
  }
})
