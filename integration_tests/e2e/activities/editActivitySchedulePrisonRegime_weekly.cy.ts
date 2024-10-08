import getActivity from '../../fixtures/activitiesApi/getActivity.json'
import getPrisonRegime from '../../fixtures/activitiesApi/getPrisonRegime.json'
import moorlandIncentiveLevels from '../../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import ViewActivityPage from '../../pages/createActivity/viewActivity'
import CustomTimesChangeOptionPage from '../../pages/createSchedule/customTimesChangeOption'
import DaysAndSessionsPage from '../../pages/createSchedule/daysAndSessions'

import SessionTimesPage from '../../pages/createSchedule/sessionTimes'
import Page from '../../pages/page'

context('Edit activity - weekly', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()

    const getActivity3 = { ...getActivity }
    getActivity3.id = 3
    getActivity3.schedules[0].usePrisonRegimeTime = true
    getActivity3.schedules[0].slots = [
      {
        id: 5,
        weekNumber: 1,
        startTime: '08:30',
        endTime: '11:45',
        daysOfWeek: ['Mon'],
        mondayFlag: true,
        tuesdayFlag: false,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
        timeSlot: 'AM',
      },
      {
        id: 5,
        weekNumber: 1,
        startTime: '08:30',
        endTime: '11:45',
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
        id: 5,
        weekNumber: 1,
        startTime: '13:45',
        endTime: '16:45',
        daysOfWeek: ['Tue'],
        mondayFlag: false,
        tuesdayFlag: true,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
        timeSlot: 'PM',
      },
      {
        id: 6,
        weekNumber: 1,
        startTime: '08:30',
        endTime: '11:45',
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
        startTime: '13:45',
        endTime: '16:45',
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
      {
        id: 6,
        weekNumber: 1,
        startTime: '17:30',
        endTime: '19:15',
        daysOfWeek: ['Thu'],
        mondayFlag: false,
        tuesdayFlag: false,
        wednesdayFlag: false,
        thursdayFlag: true,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
        timeSlot: 'ED',
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
    cy.stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels)
    cy.stubEndpoint('GET', '/prison/prison-regime/MDI', getPrisonRegime)
    cy.stubEndpoint('GET', '/activities/3/filtered', getActivity3)
    cy.stubEndpoint('PATCH', '/activities/MDI/activityId/3', getActivity3)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', inmateDetails)
  })
  it('should remove a day when updating the schedule using prison regime times', () => {
    cy.visit('/activities/view/3')
    const viewActivityPage = Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.changeScheduleLink().click()
    const customTimesChangeOptionPage = Page.verifyOnPage(CustomTimesChangeOptionPage)
    customTimesChangeOptionPage.changeDaysAndSessions('Days and sessions when this activity runs')
    customTimesChangeOptionPage.continue()
    const daysAndSessionsPage = Page.verifyOnPage(DaysAndSessionsPage)
    daysAndSessionsPage.checkboxes().find('input[value="monday"]').should('be.checked')
    daysAndSessionsPage.getInputById('timeSlotsMonday').should('be.checked')
    daysAndSessionsPage.checkboxes().find('input[value="tuesday"]').should('be.checked')
    daysAndSessionsPage.getInputById('timeSlotsTuesday').should('be.checked')
    daysAndSessionsPage.getInputById('timeSlotsTuesday-2').should('be.checked')
    daysAndSessionsPage.checkboxes().find('input[value="wednesday"]').should('be.checked')
    daysAndSessionsPage.getInputById('timeSlotsWednesday').should('be.checked')
    daysAndSessionsPage.getInputById('timeSlotsWednesday-2').should('be.checked')
    daysAndSessionsPage.checkboxes().find('input[value="thursday"]').should('be.checked')
    daysAndSessionsPage.getInputById('timeSlotsThursday-3').should('be.checked')

    daysAndSessionsPage.checkboxes().find('input[value="thursday"]').uncheck()
    daysAndSessionsPage.updateButton()

    Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.assertNotificationContents(
      'Activity updated',
      `You've updated the daily schedule for English level 1`,
    )
  })
  it('should add a day when updating the schedule using prison regime times', () => {
    cy.visit('/activities/view/3')
    const viewActivityPage = Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.changeScheduleLink().click()
    const customTimesChangeOptionPage = Page.verifyOnPage(CustomTimesChangeOptionPage)
    customTimesChangeOptionPage.changeDaysAndSessions('Days and sessions when this activity runs')
    customTimesChangeOptionPage.continue()
    const daysAndSessionsPage = Page.verifyOnPage(DaysAndSessionsPage)

    daysAndSessionsPage.getInputById('timeSlotsWednesday-2').check()
    daysAndSessionsPage.updateButton()

    Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.assertNotificationContents(
      'Activity updated',
      `You've updated the daily schedule for English level 1`,
    )
  })
  it('should change times when updating the schedule', () => {
    cy.visit('/activities/view/3')
    const viewActivityPage = Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.changeScheduleLink().click()
    const customTimesChangeOptionPage = Page.verifyOnPage(CustomTimesChangeOptionPage)
    customTimesChangeOptionPage.changeDaysAndSessions('Activity start and end times')
    customTimesChangeOptionPage.continue()
    const sessionTimesPage = Page.verifyOnPage(SessionTimesPage)

    sessionTimesPage.checkTableRow('1', 'Monday', 'AM', 0, '08', '30', '11', '45')
    sessionTimesPage.checkTableRow('1', 'Tuesday', 'AM', 4, '08', '30', '11', '45')
    sessionTimesPage.checkTableRow('1', 'Tuesday', 'PM', 8, '13', '45', '16', '45')
    sessionTimesPage.checkTableRow('1', 'Wednesday', 'AM', 12, '08', '30', '11', '45')
    sessionTimesPage.checkTableRow('1', 'Wednesday', 'PM', 16, '13', '45', '16', '45')
    sessionTimesPage.checkTableRow('1', 'Thursday', 'ED', 20, '17', '30', '19', '15')

    sessionTimesPage.selectStartTime(10, 45, '1', 'MONDAY', 'AM')
    sessionTimesPage.continue()
    Page.verifyOnPage(ViewActivityPage)
  })
})
