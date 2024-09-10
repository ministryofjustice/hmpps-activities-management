import { addDays } from 'date-fns'
import Page from '../../pages/page'
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
import CustomTimesChangeOptionPage from '../../pages/createSchedule/customTimesChangeOption'
import DaysAndTimesPage from '../../pages/createSchedule/daysAndTimes'
import SessionTimesPage from '../../pages/createSchedule/sessionTimes'
import CustomTimesChangeDefaultCustom from '../../pages/createSchedule/customTimesChangeDefaultCustom'

context('Edit activity - 2 weekly', () => {
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
    getActivity2.schedules[0].scheduleWeeks = 2
    getActivity2.schedules[0].slots = [
      {
        id: 2051,
        timeSlot: 'AM',
        weekNumber: 1,
        startTime: '09:00',
        endTime: '12:00',
        daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu'],
        mondayFlag: true,
        tuesdayFlag: true,
        wednesdayFlag: true,
        thursdayFlag: true,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
      {
        id: 2052,
        timeSlot: 'PM',
        weekNumber: 2,
        startTime: '13:30',
        endTime: '17:00',
        daysOfWeek: ['Mon', 'Tue', 'Wed'],
        mondayFlag: true,
        tuesdayFlag: true,
        wednesdayFlag: true,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
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

  it('should allow the user to change an activity - changing days/sessions if using custom times', () => {
    cy.visit('/activities/view/2')
    const viewActivityPage = Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.changeScheduleLink().first().click()

    const customTimesChangeOptionPage = Page.verifyOnPage(CustomTimesChangeOptionPage)
    customTimesChangeOptionPage.changeDaysAndSessions('Days and sessions when this activity runs')
    customTimesChangeOptionPage.continue()

    const daysAndTimesPage = Page.verifyOnPage(DaysAndTimesPage)
    daysAndTimesPage.checkboxes().find('input[value="monday"]').should('be.checked')
    daysAndTimesPage.getInputById('timeSlotsMonday').should('be.checked')
    daysAndTimesPage.checkboxes().find('input[value="tuesday"]').should('be.checked')
    daysAndTimesPage.getInputById('timeSlotsTuesday').should('be.checked')
    daysAndTimesPage.checkboxes().find('input[value="wednesday"]').should('be.checked')
    daysAndTimesPage.getInputById('timeSlotsWednesday').should('be.checked')
    daysAndTimesPage.checkboxes().find('input[value="thursday"]').should('be.checked')
    daysAndTimesPage.getInputById('timeSlotsThursday').should('be.checked')
    daysAndTimesPage.uncheckAllCheckboxes()
    daysAndTimesPage.selectDayTimeCheckboxes([
      ['Monday', ['AM session']],
      ['Wednesday', ['AM session', 'PM session']],
    ])
    daysAndTimesPage.updateButton()

    const sessionTimesPage = Page.verifyOnPage(SessionTimesPage)
    sessionTimesPage.checkTime('09', '00', '12', '00', '1', 'MONDAY', 'AM')
    sessionTimesPage.checkTime('09', '00', '12', '00', '1', 'WEDNESDAY', 'AM')
    sessionTimesPage.checkTime('--', '--', '--', '--', '1', 'WEDNESDAY', 'PM')

    sessionTimesPage.checkTime('13', '30', '17', '00', '2', 'MONDAY', 'PM')
    sessionTimesPage.checkTime('13', '30', '17', '00', '2', 'TUESDAY', 'PM')
    sessionTimesPage.checkTime('13', '30', '17', '00', '2', 'WEDNESDAY', 'PM')

    sessionTimesPage.selectStartTime(14, 45, '1', 'WEDNESDAY', 'PM')
    sessionTimesPage.selectEndTime(17, 50, '1', 'WEDNESDAY', 'PM')
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
    viewActivityPage.changeScheduleLink().last().click()

    const customTimesChangeOptionPage = Page.verifyOnPage(CustomTimesChangeOptionPage)
    customTimesChangeOptionPage.changeDaysAndSessions('Activity start and end times')
    customTimesChangeOptionPage.continue()

    const customTimesChangeDefaultCustomPage = Page.verifyOnPage(CustomTimesChangeDefaultCustom)
    customTimesChangeDefaultCustomPage.changeTimes('Select start and end times to change')
    customTimesChangeDefaultCustomPage.continue()
    const sessionTimesPage = Page.verifyOnPage(SessionTimesPage)
    sessionTimesPage.checkTime('09', '00', '12', '00', '1', 'MONDAY', 'AM')
    sessionTimesPage.checkTime('09', '00', '12', '00', '1', 'TUESDAY', 'AM')
    sessionTimesPage.checkTime('09', '00', '12', '00', '1', 'WEDNESDAY', 'AM')
    sessionTimesPage.checkTime('09', '00', '12', '00', '1', 'THURSDAY', 'AM')

    sessionTimesPage.checkTime('13', '30', '17', '00', '2', 'MONDAY', 'PM')
    sessionTimesPage.checkTime('13', '30', '17', '00', '2', 'TUESDAY', 'PM')
    sessionTimesPage.checkTime('13', '30', '17', '00', '2', 'WEDNESDAY', 'PM')

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
    viewActivityPage.changeScheduleLink().first().click()

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
