import getActivity from '../../fixtures/activitiesApi/getActivity.json'
import getPrisonRegime from '../../fixtures/activitiesApi/getPrisonRegime.json'
import moorlandIncentiveLevels from '../../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import ViewActivityPage from '../../pages/createActivity/viewActivity'
import CustomTimesChangeOptionPage from '../../pages/createSchedule/customTimesChangeOption'
import DaysAndSessionsPage from '../../pages/createSchedule/daysAndSessions'
import SessionTimesPage from '../../pages/createSchedule/sessionTimes'
import Page from '../../pages/page'

context('Edit activity', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()

    const getActivity4 = { ...getActivity }
    getActivity4.id = 4
    getActivity4.schedules[0].usePrisonRegimeTime = true
    getActivity4.schedules[0].scheduleWeeks = 2
    getActivity4.schedules[0].slots = [
      {
        id: 2051,
        timeSlot: 'AM',
        weekNumber: 1,
        startTime: '08:30',
        endTime: '11:45',
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
        startTime: '13:45',
        endTime: '16:45',
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
    cy.stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels)
    cy.stubEndpoint('GET', '/prison/prison-regime/MDI', getPrisonRegime)
    cy.stubEndpoint('GET', '/activities/4/filtered', getActivity4)
    cy.stubEndpoint('PATCH', '/activities/MDI/activityId/4', getActivity4)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', inmateDetails)
  })
  it('should remove a day when updating from the default regime times', () => {
    cy.visit('/activities/view/4')
    const viewActivityPage = Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.changeScheduleLink().first().click()
    const customTimesChangeOptionPage = Page.verifyOnPage(CustomTimesChangeOptionPage)
    customTimesChangeOptionPage.changeDaysAndSessions('Days and sessions when this activity runs')
    customTimesChangeOptionPage.continue()
    const daysAndSessionsPage = Page.verifyOnPage(DaysAndSessionsPage)
    daysAndSessionsPage.title().contains('Week 1 of 2')
    daysAndSessionsPage.checkboxes().find('input[value="monday"]').should('be.checked')
    daysAndSessionsPage.getInputById('timeSlotsMonday').should('be.checked')
    daysAndSessionsPage.checkboxes().find('input[value="tuesday"]').should('be.checked')
    daysAndSessionsPage.getInputById('timeSlotsTuesday').should('be.checked')
    daysAndSessionsPage.checkboxes().find('input[value="wednesday"]').should('be.checked')
    daysAndSessionsPage.getInputById('timeSlotsWednesday').should('be.checked')
    daysAndSessionsPage.checkboxes().find('input[value="thursday"]').should('be.checked')
    daysAndSessionsPage.getInputById('timeSlotsThursday').should('be.checked')

    daysAndSessionsPage.checkboxes().find('input[value="thursday"]').uncheck()
    daysAndSessionsPage.updateButton()

    Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.assertNotificationContents(
      'Activity updated',
      `You've updated the daily schedule for English level 1`,
    )
  })
  it('should add a day when updating from the default regime times', () => {
    cy.visit('/activities/view/4')
    const viewActivityPage = Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.changeScheduleLink().last().click()
    const customTimesChangeOptionPage = Page.verifyOnPage(CustomTimesChangeOptionPage)
    customTimesChangeOptionPage.changeDaysAndSessions('Days and sessions when this activity runs')
    customTimesChangeOptionPage.continue()
    const daysAndSessionsPage = Page.verifyOnPage(DaysAndSessionsPage)
    daysAndSessionsPage.title().contains('Week 2 of 2')
    daysAndSessionsPage.checkboxes().find('input[value="monday"]').should('be.checked')
    daysAndSessionsPage.getInputById('timeSlotsMonday-2').should('be.checked')
    daysAndSessionsPage.checkboxes().find('input[value="tuesday"]').should('be.checked')
    daysAndSessionsPage.getInputById('timeSlotsTuesday-2').should('be.checked')
    daysAndSessionsPage.checkboxes().find('input[value="wednesday"]').should('be.checked')
    daysAndSessionsPage.getInputById('timeSlotsWednesday-2').should('be.checked')

    daysAndSessionsPage.getInputById('timeSlotsWednesday').check()
    daysAndSessionsPage.updateButton()

    Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.assertNotificationContents(
      'Activity updated',
      `You've updated the daily schedule for English level 1`,
    )
  })
  it('should change times if currently using regime times', () => {
    cy.visit('/activities/view/4')
    const viewActivityPage = Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.changeScheduleLink().first().click()
    const customTimesChangeOptionPage = Page.verifyOnPage(CustomTimesChangeOptionPage)
    customTimesChangeOptionPage.changeDaysAndSessions('Activity start and end times')
    customTimesChangeOptionPage.continue()
    const sessionTimesPage = Page.verifyOnPage(SessionTimesPage)

    sessionTimesPage.checkTableRow('1', 'Monday', 'AM', 0, '08', '30', '11', '45')
    sessionTimesPage.checkTableRow('1', 'Tuesday', 'AM', 4, '08', '30', '11', '45')
    sessionTimesPage.checkTableRow('1', 'Wednesday', 'AM', 8, '08', '30', '11', '45')
    sessionTimesPage.checkTableRow('1', 'Thursday', 'AM', 12, '08', '30', '11', '45')
    sessionTimesPage.checkTableRow('2', 'Monday', 'PM', 16, '13', '45', '16', '45')
    sessionTimesPage.checkTableRow('2', 'Tuesday', 'PM', 20, '13', '45', '16', '45')
    sessionTimesPage.checkTableRow('2', 'Wednesday', 'PM', 24, '13', '45', '16', '45')

    sessionTimesPage.selectStartTime(10, 45, '1', 'MONDAY', 'AM')
    sessionTimesPage.continue()
    Page.verifyOnPage(ViewActivityPage)
  })
})
