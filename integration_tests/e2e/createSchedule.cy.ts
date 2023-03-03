import { addMonths } from 'date-fns'

import getActivity from '../fixtures/activitiesApi/getActivity.json'
import getSchedule from '../fixtures/activitiesApi/getSchedule.json'
import getEventLocations from '../fixtures/prisonApi/getEventLocations.json'

import Page from '../pages/page'
import IndexPage from '../pages/index'
import NamePage from '../pages/createSchedule/name'
import StartDatePage from '../pages/createSchedule/startDate'
import EndDateOptionPage from '../pages/createSchedule/endDateOption'
import EndDatePage from '../pages/createSchedule/endDate'
import DaysAndTimesPage from '../pages/createSchedule/daysAndTimes'
import BankHolidayPage from '../pages/createSchedule/bankHoliday'
import LocationPage from '../pages/createSchedule/location'
import CapacityPage from '../pages/createSchedule/capacity'
import CheckAnswersPage from '../pages/createSchedule/checkAnswers'
import { formatDate } from '../../server/utils/utils'
import ConfirmationPage from '../pages/createSchedule/confirmation'

context('Create schedule', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')

    cy.stubEndpoint('GET', '/activities/2', getActivity)
    cy.stubEndpoint('GET', '/api/agencies/MDI/eventLocations', getEventLocations)
    cy.stubEndpoint('POST', '/activities/2/schedules', getSchedule)
    cy.signIn()
  })

  it('should click through create schedule journey', () => {
    Page.verifyOnPage(IndexPage)
    // To be removed when there is an entry point for this journey
    cy.visit('/schedule/activities/2/create-schedule/start')

    const scheduleNamePage = Page.verifyOnPage(NamePage)
    scheduleNamePage
      .activityInfo()
      .should('contain', 'Education')
      .should('contain', 'Risk level: Low')
      .should('contain', 'Minimum incentive: Basic')
    scheduleNamePage.activitySummary().should('contain', 'English level 1')
    scheduleNamePage.enterName('Entry level English 1')
    scheduleNamePage.continue()

    const startDatePage = Page.verifyOnPage(StartDatePage)
    const startDatePicker = startDatePage.getDatePicker()
    const startDate = addMonths(new Date(), 1)
    startDatePicker.enterDate(startDate)
    startDatePage.continue()

    const endDateOptionPage = Page.verifyOnPage(EndDateOptionPage)
    endDateOptionPage.addEndDate('Yes')
    endDateOptionPage.continue()

    const endDatePage = Page.verifyOnPage(EndDatePage)
    const endDatePicker = endDatePage.getDatePicker()
    const endDate = addMonths(new Date(), 8)
    endDatePicker.enterDate(endDate)
    endDatePage.continue()

    const daysAndTimesPage = Page.verifyOnPage(DaysAndTimesPage)
    daysAndTimesPage.selectDayTimeCheckboxes([
      ['Monday', ['AM session']],
      ['Wednesday', ['AM session', 'PM session']],
      ['Thursday', ['AM session', 'PM session', 'ED session']],
    ])
    daysAndTimesPage.continue()

    const bankHolidayPage = Page.verifyOnPage(BankHolidayPage)
    bankHolidayPage.runOnBankHoliday('Yes')
    bankHolidayPage.continue()

    const locationPage = Page.verifyOnPage(LocationPage)
    locationPage.selectLocation('HB2 Classroom 2')
    locationPage.continue()

    const capacityPage = Page.verifyOnPage(CapacityPage)
    capacityPage.enterCapacity('6')
    capacityPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    const scheduleDetailsList = checkAnswersPage.getScheduleDetailsList()
    scheduleDetailsList.assertItem(0, 'Schedule name', 'Entry level English 1')
    scheduleDetailsList.assertItem(1, 'Location', 'HB2 Classroom 2')
    scheduleDetailsList.assertItem(2, 'Capacity', '6')
    const datesAndScheduleList = checkAnswersPage.getDatesAndScheduleList()
    datesAndScheduleList.assertItem(0, 'Start date', formatDate(startDate, 'do MMMM yyyy'))
    datesAndScheduleList.assertItem(1, 'End date', formatDate(endDate, 'do MMMM yyyy'))
    datesAndScheduleList.assertItem(2, 'Days and times', 'Monday (AM)')
    datesAndScheduleList.assertItem(2, 'Days and times', 'Wednesday (AM, PM)')
    datesAndScheduleList.assertItem(2, 'Days and times', 'Thursday (AM, PM, ED)')
    datesAndScheduleList.assertItem(3, 'Runs on bank holidays', 'Yes')
    const activityDetailsList = checkAnswersPage.getActivityDetailsList()
    activityDetailsList.assertItem(0, 'Category', 'Education')
    activityDetailsList.assertItem(1, 'Name', 'English level 1')
    activityDetailsList.assertItem(2, 'Risk level', 'Low')
    activityDetailsList.assertItem(3, 'Minimum incentive level', 'Basic')
    checkAnswersPage.getLinkByText('Cancel and return to activities dashboard').should('exist')
    checkAnswersPage.createScheduleButton().click()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.assertSuccessMessage('Entry level English 1 created')
    confirmationPage.getLinkByText('allocating people to this schedule').should('exist')
    confirmationPage.getLinkByText('Build another schedule for English level 1').should('exist')
    confirmationPage.getLinkByText('Use the activities dashboard').should('exist')
  })
})
