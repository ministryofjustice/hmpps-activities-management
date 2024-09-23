import { addDays } from 'date-fns'
import Page from '../../pages/page'
import PayRateTypePage from '../../pages/createActivity/payRateType'
import PayPage from '../../pages/createActivity/pay'
import CheckPayPage from '../../pages/createActivity/checkPay'
import moorlandPayBands from '../../fixtures/activitiesApi/getMdiPrisonPayBands.json'
import moorlandIncentiveLevels from '../../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import getPayProfile from '../../fixtures/prisonApi/getPayProfile.json'
import getActivity from '../../fixtures/activitiesApi/getActivity.json'
import getAllocations from '../../fixtures/activitiesApi/getAllocations.json'
import prisonerAllocations from '../../fixtures/activitiesApi/prisonerAllocations.json'
import getCandidates from '../../fixtures/activitiesApi/getCandidates.json'
import getPrisonRegime from '../../fixtures/activitiesApi/getPrisonRegime.json'

import { formatIsoDate } from '../../../server/utils/datePickerUtils'
import ViewActivityPage from '../../pages/createActivity/viewActivity'
import PayAmountPage from '../../pages/createActivity/pay-amount'
import PayDateOptionPage from '../../pages/createActivity/pay-date-option'
import CancelPayRatePage from '../../pages/createActivity/cancel-pay-rate'
import CustomTimesChangeOptionPage from '../../pages/createSchedule/customTimesChangeOption'
import DaysAndSessionsPage from '../../pages/createSchedule/daysAndSessions'
import SessionTimesPage from '../../pages/createSchedule/sessionTimes'
import CustomTimesChangeDefaultCustom from '../../pages/createSchedule/customTimesChangeDefaultCustom'

context('Edit activity', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
    cy.stubEndpoint('GET', '/prison/MDI/prison-pay-bands', moorlandPayBands)
    cy.stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels)
    cy.stubEndpoint('GET', '/api/agencies/MDI/pay-profile', getPayProfile)
    cy.stubEndpoint('GET', '/schedules/2/allocations\\?activeOnly=true&includePrisonerSummary=true', getAllocations)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations)
    cy.stubEndpoint('GET', '/schedules/2/waiting-list-applications', JSON.parse('[]'))
    cy.stubEndpoint('GET', '/schedules/2/candidates(.)*', getCandidates)
    cy.stubEndpoint('POST', '/schedules/2/allocations')
    cy.stubEndpoint('GET', '/prison/prison-regime/MDI', getPrisonRegime)

    const getActivity2 = { ...getActivity }
    getActivity2.schedules[0].startDate = formatIsoDate(addDays(new Date(), 1))
    getActivity2.schedules[0].activity.paid = true
    getActivity2.schedules[0].usePrisonRegimeTime = false
    getActivity2.schedules[0].slots = [
      {
        id: 5,
        weekNumber: 1,
        startTime: '10:00',
        endTime: '11:00',
        daysOfWeek: ['Tue'],
        mondayFlag: false,
        tuesdayFlag: true,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
        timeSlot: 'AM',
      },
      {
        id: 6,
        weekNumber: 1,
        startTime: '10:00',
        endTime: '11:00',
        daysOfWeek: ['Wed'],
        mondayFlag: false,
        tuesdayFlag: false,
        wednesdayFlag: true,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
        timeSlot: 'AM',
      },
      {
        id: 6,
        weekNumber: 1,
        startTime: '13:00',
        endTime: '16:00',
        daysOfWeek: ['Wed'],
        mondayFlag: false,
        tuesdayFlag: false,
        wednesdayFlag: true,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
        timeSlot: 'PM',
      },
    ]
    const inmateDetails = [
      {
        prisonerNumber: 'A9477DY',
        firstName: 'JOHN',
        lastName: 'JONES',
      },
      {
        prisonerNumber: 'G4793VF',
        firstName: 'JACK',
        lastName: 'SMITH',
      },
    ]
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', inmateDetails)
    cy.stubEndpoint('GET', '/activities/2/filtered', getActivity2)
    cy.stubEndpoint('PATCH', '/activities/MDI/activityId/2', getActivity2)
  })

  it('should follow create and then cancel future pay rate user journey', () => {
    const twentyNineDaysAhead = addDays(new Date(), 29)
    cy.visit('/activities/view/2')

    const viewActivityPage = Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.changePayLink().click()

    const checkPayPage = Page.verifyOnPage(CheckPayPage)
    checkPayPage.addNewPayRate()

    const payRateTypePage2 = Page.verifyOnPage(PayRateTypePage)
    payRateTypePage2.incentiveLevel('Enhanced')
    payRateTypePage2.continue()

    const payPage = Page.verifyOnPage(PayPage)
    payPage.enterPayAmount('1.00')
    payPage.selectPayBand('High')
    payPage.futurePayRateDetails().should('not.exist')
    payPage.radios().should('not.exist')
    payPage.saveAndContinue()

    Page.verifyOnPage(CheckPayPage)
    checkPayPage.changePay()

    const payAmountPage = Page.verifyOnPage(PayAmountPage)
    payAmountPage.enterPayAmount('{backspace}{backspace}{backspace}{backspace}1.35')
    payAmountPage.continue()

    const payDateOptionPage = Page.verifyOnPage(PayDateOptionPage)
    payDateOptionPage.dateOptionOther()
    payDateOptionPage.selectDatePickerDate(twentyNineDaysAhead)
    payDateOptionPage.confirm()

    Page.verifyOnPage(CheckPayPage)
    checkPayPage.cancelPay()

    const cancelPayRatePage = Page.verifyOnPage(CancelPayRatePage)
    cancelPayRatePage.cancelPayRate()
    cancelPayRatePage.confirm()
  })
  it('should allow the user to change an activity - changing days/sessions if using custom times', () => {
    cy.visit('/activities/view/2')
    const viewActivityPage = Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.changeScheduleLink().click()

    const customTimesChangeOptionPage = Page.verifyOnPage(CustomTimesChangeOptionPage)
    customTimesChangeOptionPage.changeDaysAndSessions('Days and sessions when this activity runs')
    customTimesChangeOptionPage.continue()

    const daysAndSessionsPage = Page.verifyOnPage(DaysAndSessionsPage)
    daysAndSessionsPage.checkboxes().find('input[value="tuesday"]').should('be.checked')
    daysAndSessionsPage.getInputById('timeSlotsTuesday').should('be.checked')
    daysAndSessionsPage.checkboxes().find('input[value="wednesday"]').should('be.checked')
    daysAndSessionsPage.getInputById('timeSlotsWednesday').should('be.checked')
    daysAndSessionsPage.getInputById('timeSlotsWednesday-2').should('be.checked')
    daysAndSessionsPage.uncheckAllCheckboxes()
    daysAndSessionsPage.selectDayTimeCheckboxes([
      ['Monday', ['AM session']],
      ['Wednesday', ['AM session', 'PM session']],
    ])
    daysAndSessionsPage.updateButton()

    const sessionTimesPage = Page.verifyOnPage(SessionTimesPage)
    sessionTimesPage.checkTime('--', '--', '--', '--', '1', 'MONDAY', 'AM')
    sessionTimesPage.checkTime('10', '00', '11', '00', '1', 'WEDNESDAY', 'AM')
    sessionTimesPage.checkTime('13', '00', '16', '00', '1', 'WEDNESDAY', 'PM')

    sessionTimesPage.selectStartTime(10, 45, '1', 'MONDAY', 'AM')
    sessionTimesPage.selectEndTime(11, 50, '1', 'MONDAY', 'AM')
    sessionTimesPage.continue()

    Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.assertNotificationContents(
      'Activity updated',
      `You've updated the daily schedule for English level 1`,
    )
  })
  it('should allow the user to change an activity - changing times if currently using custom times', () => {
    cy.visit('/activities/view/2')
    const viewActivityPage = Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.changeScheduleLink().click()

    const customTimesChangeOptionPage = Page.verifyOnPage(CustomTimesChangeOptionPage)
    customTimesChangeOptionPage.changeDaysAndSessions('Activity start and end times')
    customTimesChangeOptionPage.continue()

    const customTimesChangeDefaultCustomPage = Page.verifyOnPage(CustomTimesChangeDefaultCustom)
    customTimesChangeDefaultCustomPage.changeTimes('Select start and end times to change')
    customTimesChangeDefaultCustomPage.continue()
    const sessionTimesPage = Page.verifyOnPage(SessionTimesPage)
    sessionTimesPage.checkTime('10', '00', '11', '00', '1', 'TUESDAY', 'AM')
    sessionTimesPage.checkTime('10', '00', '11', '00', '1', 'WEDNESDAY', 'AM')
    sessionTimesPage.checkTime('13', '00', '16', '00', '1', 'WEDNESDAY', 'PM')

    sessionTimesPage.clearTime('1', 'TUESDAY', 'AM')
    sessionTimesPage.selectStartTime(9, 30, '1', 'TUESDAY', 'AM')
    sessionTimesPage.selectEndTime(11, 50, '1', 'TUESDAY', 'AM')
    sessionTimesPage.continue()
    Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.assertNotificationContents(
      'Activity updated',
      `You've updated the daily schedule for English level 1`,
    )
  })
  it('should allow the user to change an activity - changing times if currently using custom times - change to regime times', () => {
    cy.visit('/activities/view/2')
    const viewActivityPage = Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.changeScheduleLink().click()

    const customTimesChangeOptionPage = Page.verifyOnPage(CustomTimesChangeOptionPage)
    customTimesChangeOptionPage.changeDaysAndSessions('Activity start and end times')
    customTimesChangeOptionPage.continue()

    const customTimesChangeDefaultCustomPage = Page.verifyOnPage(CustomTimesChangeDefaultCustom)
    customTimesChangeDefaultCustomPage.changeTimes('Change all start and end times to prison regime times')
    customTimesChangeDefaultCustomPage.continue()

    Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.assertNotificationContents(
      'Activity updated',
      `You've updated the daily schedule for English level 1`,
    )
  })
})
