import { addDays, format, startOfToday } from 'date-fns'
import IndexPage from '../../pages'
import Page from '../../pages/page'
import getLocationGroups from '../../fixtures/activitiesApi/getLocationGroups.json'
import ActivitiesIndexPage from '../../pages/activities'
import UnlockAndMovementIndexPage from '../../pages/unlockAndMovements/unlockAndMovementDashboard'
import ChooseDateAndLocationPage from '../../pages/unlockAndMovements/unlock/chooseDateAndLocation'
import getPrisonPrisoners from '../../fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A1350DZ-A8644DY.json'
import getScheduledEvents from '../../fixtures/activitiesApi/getScheduleEvents-MDI-A1350DZ-A8644DY.json'
import getCategories from '../../fixtures/activitiesApi/getCategories.json'
import PlannedEventsPage from '../../pages/unlockAndMovements/unlock/plannedEventsPage'
import { CAT_A_BADGE, CONTROLLED_UNLOCK_BADGE, PEEP_BADGE } from '../../pages/unlockAndMovements/abstractEventsPage'

const today = format(startOfToday(), 'yyyy-MM-dd')
const tomorrow = format(addDays(startOfToday(), 1), 'yyyy-MM-dd')
const locPrefixBlock1 = 'MDI-1-.+'
const locPrefixBlock2AWing = 'MDI-1-1-0(0[1-9]|1[0-2]),MDI-1-2-0(0[1-9]|1[0-2]),MDI-1-3-0(0[1-9]|1[0-2])'
const locPrefixBlock2BWing = 'MDI-1-1-0(1[3-9]|2[0-6]),MDI-1-2-0(1[3-9]|2[0-6]),MDI-1-3-0(1[3-9]|2[0-6])'
const locPrefixBlock2CWing = 'MDI-1-1-0(2[7-9]|3[0-8]),MDI-1-2-0(2[7-9]|3[0-8]),MDI-1-3-0(2[7-9]|3[0-8])'

const toLocPrefix = (prefix: string) => JSON.parse(`{"locationPrefix": "${prefix}"}`)

getScheduledEvents.courtHearings.push({
  prisonCode: 'MDI',
  eventSource: 'NOMIS',
  eventType: 'COURT_HEARING',
  eventId: 10001,
  bookingId: 10001,
  internalLocationDescription: 'Bradford County Court',
  summary: 'Court hearing',
  prisonerNumber: 'A2345DP',
  date: '2024-03-25',
  startTime: '13:00',
  endTime: '15:00',
  priority: 1,
})

getPrisonPrisoners.content.push({
  prisonerNumber: 'A2345DP',
  bookingId: '1202189',
  bookNumber: '39298A',
  firstName: 'TEST',
  lastName: 'COURTEE',
  dateOfBirth: '1970-01-01',
  gender: 'Male',
  youthOffender: false,
  status: 'ACTIVE IN',
  lastMovementTypeCode: 'ADM',
  lastMovementReasonCode: 'I',
  inOutStatus: 'IN',
  prisonId: 'MDI',
  prisonName: 'Moorland (HMP & YOI)',
  cellLocation: '1-3-015',
  category: 'C',
  aliases: [],
  alerts: [],
  legalStatus: 'SENTENCED',
  imprisonmentStatus: 'UNK_SENT',
  imprisonmentStatusDescription: 'Unknown Sentenced',
  mostSeriousOffence: 'Drive vehicle for more than 13 hours or more in a working day - domestic',
  recall: false,
  indeterminateSentence: false,
  receptionDate: '2022-04-25',
  locationDescription: 'Moorland (HMP & YOI)',
  restrictedPatient: false,
  currentIncentive: {
    level: {
      code: 'ENH',
      description: 'Enhanced',
    },
    dateTime: '2022-04-25T12:16:58',
    nextReviewDate: '2023-04-25',
  },
})

context('Create activity', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
    cy.stubEndpoint('GET', '/locations/prison/MDI/location-groups', getLocationGroups)
    cy.stubEndpoint('GET', '/users/SCH_ACTIVITY', JSON.parse('{"name": "Schedule Activity", "username": "jsmith"}'))
    cy.stubEndpoint(
      'GET',
      '/locations/prison/MDI/location-prefix\\?groupName=Houseblock%201',
      toLocPrefix(locPrefixBlock1),
    )
    cy.stubEndpoint(
      'GET',
      '/locations/prison/MDI/location-prefix\\?groupName=Houseblock%201_A-Wing',
      toLocPrefix(locPrefixBlock2AWing),
    )
    cy.stubEndpoint(
      'GET',
      '/locations/prison/MDI/location-prefix\\?groupName=Houseblock%201_B-Wing',
      toLocPrefix(locPrefixBlock2BWing),
    )
    cy.stubEndpoint(
      'GET',
      '/locations/prison/MDI/location-prefix\\?groupName=Houseblock%201_C-Wing',
      toLocPrefix(locPrefixBlock2CWing),
    )
    cy.stubEndpoint(
      'GET',
      '/prison/MDI/prisoners\\?page=0&size=1024&cellLocationPrefix=MDI-1-&sort=cellLocation',
      getPrisonPrisoners,
    )
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${today}&timeSlot=AM`, getScheduledEvents)
    cy.stubEndpoint('GET', '/activity-categories', getCategories)
  })

  it('should show correct alerts', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.unlockAndMovementCard().click()

    const manageActivitiesPage = Page.verifyOnPage(UnlockAndMovementIndexPage)
    manageActivitiesPage.createUnlockListsCard().should('contain.text', 'Create unlock lists')
    manageActivitiesPage.createUnlockListsCard().click()

    const chooseDateAndLocationPage = Page.verifyOnPage(ChooseDateAndLocationPage)
    chooseDateAndLocationPage.selectToday()
    chooseDateAndLocationPage.selectAM()
    chooseDateAndLocationPage.selectLocation('Houseblock 1')
    chooseDateAndLocationPage.continue()

    const plannedEventsPage = Page.verifyOnPage(PlannedEventsPage)
    plannedEventsPage.assertBadges(0, CONTROLLED_UNLOCK_BADGE, PEEP_BADGE)
    plannedEventsPage.assertBadges(1, CAT_A_BADGE, CONTROLLED_UNLOCK_BADGE)

    plannedEventsPage.getButton('Hide filter').should('be.visible')
    plannedEventsPage.acctAlertCheckbox().should('be.checked')
    plannedEventsPage.controlledUnlockAlertCheckbox().should('be.checked')
    plannedEventsPage.eListAlertCheckbox().should('be.checked')
    plannedEventsPage.peepAlertCheckbox().should('be.checked')
    plannedEventsPage.tactAlertCheckbox().should('be.checked')
    plannedEventsPage.catAAlertCheckbox().should('be.checked')
    plannedEventsPage.catAHigherAlertCheckbox().should('be.checked')
    plannedEventsPage.catAProvisionalAlertCheckbox().should('be.checked')

    plannedEventsPage.controlledUnlockAlertCheckbox().uncheck()
    plannedEventsPage.getButton('Apply filters').eq(0).click()

    plannedEventsPage.assertBadges(0, PEEP_BADGE)
    plannedEventsPage.assertBadges(1, CAT_A_BADGE)

    plannedEventsPage.getButton('Hide filter').should('be.visible')
    plannedEventsPage.acctAlertCheckbox().should('be.checked')
    plannedEventsPage.controlledUnlockAlertCheckbox().should('not.be.checked')
    plannedEventsPage.eListAlertCheckbox().should('be.checked')
    plannedEventsPage.peepAlertCheckbox().should('be.checked')
    plannedEventsPage.tactAlertCheckbox().should('be.checked')
    plannedEventsPage.catAAlertCheckbox().should('be.checked')
    plannedEventsPage.catAHigherAlertCheckbox().should('be.checked')
    plannedEventsPage.catAProvisionalAlertCheckbox().should('be.checked')

    plannedEventsPage.selectAllAlerts().click()
    plannedEventsPage.getButton('Apply filters').eq(0).click()
    plannedEventsPage.assertBadges(0, CONTROLLED_UNLOCK_BADGE, PEEP_BADGE)
    plannedEventsPage.assertBadges(1, CAT_A_BADGE, CONTROLLED_UNLOCK_BADGE)

    plannedEventsPage.getButton('Hide filter').should('be.visible')
    plannedEventsPage.selectAllAlerts().click()
    plannedEventsPage.acctAlertCheckbox().should('not.be.checked')
    plannedEventsPage.controlledUnlockAlertCheckbox().should('not.be.checked')
    plannedEventsPage.eListAlertCheckbox().should('not.be.checked')
    plannedEventsPage.peepAlertCheckbox().should('not.be.checked')
    plannedEventsPage.tactAlertCheckbox().should('not.be.checked')
    plannedEventsPage.catAAlertCheckbox().should('not.be.checked')
    plannedEventsPage.catAHigherAlertCheckbox().should('not.be.checked')
    plannedEventsPage.catAProvisionalAlertCheckbox().should('not.be.checked')

    plannedEventsPage.getButton('Apply filters').eq(0).click()

    plannedEventsPage.relevantAlertColumn().should('not.exist')
  })
  it('Only shows activities if the user uses the activity filter - court hearing not shown', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.unlockAndMovementCard().click()

    const manageActivitiesPage = Page.verifyOnPage(UnlockAndMovementIndexPage)
    manageActivitiesPage.createUnlockListsCard().should('contain.text', 'Create unlock lists')
    manageActivitiesPage.createUnlockListsCard().click()

    const chooseDateAndLocationPage = Page.verifyOnPage(ChooseDateAndLocationPage)
    chooseDateAndLocationPage.selectToday()
    chooseDateAndLocationPage.selectAM()
    chooseDateAndLocationPage.selectLocation('Houseblock 1')
    chooseDateAndLocationPage.continue()

    const plannedEventsPage = Page.verifyOnPage(PlannedEventsPage)
    plannedEventsPage.selectAllCategories().click()
    plannedEventsPage.categoryCheckbox('SAA_INDUSTRIES').click()
    plannedEventsPage.getButton('Apply filters').eq(0).click()
    plannedEventsPage.table().find('tr').should('have.length', 3) // this includes the header row
    plannedEventsPage
      .table()
      .find('td')
      .then(data => {
        expect(data.get(3).innerText).to.contain('Pottery AM')
        expect(data.get(3).innerText).to.contain('Tailors AM')
        expect(data.get(7).innerText).to.contain('Pottery AM')
      })
  })
  it('shows the not required tag if a prisoner has been marked as not required for unlock today, but not if the prisoner is already suspended', () => {
    const getScheduledEventsWithNotRequired = { ...getScheduledEvents }
    getScheduledEventsWithNotRequired.activities[2].attendanceStatus = 'COMPLETED'
    getScheduledEventsWithNotRequired.activities[2].attendanceReasonCode = 'NOT_REQUIRED'
    getScheduledEventsWithNotRequired.activities[0].attendanceStatus = 'COMPLETED'
    getScheduledEventsWithNotRequired.activities[0].attendanceReasonCode = 'NOT_REQUIRED'
    getScheduledEventsWithNotRequired.activities[0].suspended = true
    cy.stubEndpoint(
      'POST',
      `/scheduled-events/prison/MDI\\?date=${today}&timeSlot=AM`,
      getScheduledEventsWithNotRequired,
    )
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.unlockAndMovementCard().click()

    const manageActivitiesPage = Page.verifyOnPage(UnlockAndMovementIndexPage)
    manageActivitiesPage.createUnlockListsCard().should('contain.text', 'Create unlock lists')
    manageActivitiesPage.createUnlockListsCard().click()

    const chooseDateAndLocationPage = Page.verifyOnPage(ChooseDateAndLocationPage)
    chooseDateAndLocationPage.selectToday()
    chooseDateAndLocationPage.selectAM()
    chooseDateAndLocationPage.selectLocation('Houseblock 1')
    chooseDateAndLocationPage.continue()

    const plannedEventsPage = Page.verifyOnPage(PlannedEventsPage)
    plannedEventsPage
      .table()
      .find('td')
      .then(data => {
        expect(data.get(7).innerText).to.contain('Pottery AM')
        expect(data.get(7).innerText).to.contain('Not required')
        expect(data.get(3).innerText).to.contain('Tailors AM')
        expect(data.get(3).innerText).to.contain('Prisoner suspended')
        expect(data.get(3).innerText).to.not.contain('Not required')
      })
  })
  it('shows the not required tag if a prisoner has been marked as not required for unlock tomorrow', () => {
    const getScheduledEventsWithNotRequired = { ...getScheduledEvents }
    getScheduledEventsWithNotRequired.startDate = tomorrow
    getScheduledEventsWithNotRequired.endDate = tomorrow
    getScheduledEventsWithNotRequired.activities[2].date = tomorrow
    getScheduledEventsWithNotRequired.activities[2].attendanceStatus = null
    getScheduledEventsWithNotRequired.activities[2].attendanceReasonCode = 'NOT_REQUIRED'

    cy.stubEndpoint(
      'POST',
      `/scheduled-events/prison/MDI\\?date=${tomorrow}&timeSlot=AM`,
      getScheduledEventsWithNotRequired,
    )
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.unlockAndMovementCard().click()

    const manageActivitiesPage = Page.verifyOnPage(UnlockAndMovementIndexPage)
    manageActivitiesPage.createUnlockListsCard().should('contain.text', 'Create unlock lists')
    manageActivitiesPage.createUnlockListsCard().click()

    const chooseDateAndLocationPage = Page.verifyOnPage(ChooseDateAndLocationPage)
    chooseDateAndLocationPage.selectTomorrow()
    chooseDateAndLocationPage.selectAM()
    chooseDateAndLocationPage.selectLocation('Houseblock 1')
    chooseDateAndLocationPage.continue()

    const plannedEventsPage = Page.verifyOnPage(PlannedEventsPage)
    plannedEventsPage
      .table()
      .find('td')
      .then(data => {
        expect(data.get(7).innerText).to.contain('Pottery AM')
        expect(data.get(7).innerText).to.contain('Not required')
      })
  })
  it('should not show the link to residential attendance page if the user does not have the activity hub role', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.unlockAndMovementCard().click()

    const manageActivitiesPage = Page.verifyOnPage(UnlockAndMovementIndexPage)
    manageActivitiesPage.createUnlockListsCard().should('contain.text', 'Create unlock lists')
    manageActivitiesPage.createUnlockListsCard().click()

    const chooseDateAndLocationPage = Page.verifyOnPage(ChooseDateAndLocationPage)
    chooseDateAndLocationPage.selectToday()
    chooseDateAndLocationPage.selectAM()
    chooseDateAndLocationPage.selectLocation('Houseblock 1')
    chooseDateAndLocationPage.continue()

    const plannedEventsPage = Page.verifyOnPage(PlannedEventsPage)
    plannedEventsPage.linkToAttendance().should('not.exist')
  })
})

context('User does not have activity hub role', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignInNonActivityHubUser')
    cy.signIn()
    cy.stubEndpoint('GET', '/locations/prison/MDI/location-groups', getLocationGroups)
    cy.stubEndpoint('GET', '/users/SCH_ACTIVITY', JSON.parse('{"name": "Schedule Activity", "username": "jsmith"}'))
    cy.stubEndpoint(
      'GET',
      '/locations/prison/MDI/location-prefix\\?groupName=Houseblock%201',
      toLocPrefix(locPrefixBlock1),
    )
    cy.stubEndpoint(
      'GET',
      '/locations/prison/MDI/location-prefix\\?groupName=Houseblock%201_A-Wing',
      toLocPrefix(locPrefixBlock2AWing),
    )
    cy.stubEndpoint(
      'GET',
      '/locations/prison/MDI/location-prefix\\?groupName=Houseblock%201_B-Wing',
      toLocPrefix(locPrefixBlock2BWing),
    )
    cy.stubEndpoint(
      'GET',
      '/locations/prison/MDI/location-prefix\\?groupName=Houseblock%201_C-Wing',
      toLocPrefix(locPrefixBlock2CWing),
    )
    cy.stubEndpoint(
      'GET',
      '/prison/MDI/prisoners\\?page=0&size=1024&cellLocationPrefix=MDI-1-&sort=cellLocation',
      getPrisonPrisoners,
    )
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${today}&timeSlot=AM`, getScheduledEvents)
    cy.stubEndpoint('GET', '/activity-categories', getCategories)
  })

  it('has a link to the residential location attendance page if the user does not have the activity hub role', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.unlockAndMovementCard().click()

    const manageActivitiesPage = Page.verifyOnPage(UnlockAndMovementIndexPage)
    manageActivitiesPage.createUnlockListsCard().should('contain.text', 'Create unlock lists')
    manageActivitiesPage.createUnlockListsCard().click()

    const chooseDateAndLocationPage = Page.verifyOnPage(ChooseDateAndLocationPage)
    chooseDateAndLocationPage.selectToday()
    chooseDateAndLocationPage.selectAM()
    chooseDateAndLocationPage.selectLocation('Houseblock 1')
    chooseDateAndLocationPage.continue()

    const plannedEventsPage = Page.verifyOnPage(PlannedEventsPage)
    plannedEventsPage.linkToAttendance().should('exist')
    plannedEventsPage.linkToAttendance().click()
    cy.url().should('contain', '/attend-all/select-people-by-residential-location')
  })

  it('should show extra information tag for appointments with comments', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.unlockAndMovementCard().click()

    const manageActivitiesPage = Page.verifyOnPage(UnlockAndMovementIndexPage)
    manageActivitiesPage.createUnlockListsCard().should('contain.text', 'Create unlock lists')
    manageActivitiesPage.createUnlockListsCard().click()

    const chooseDateAndLocationPage = Page.verifyOnPage(ChooseDateAndLocationPage)
    chooseDateAndLocationPage.selectToday()
    chooseDateAndLocationPage.selectAM()
    chooseDateAndLocationPage.selectLocation('Houseblock 1')
    chooseDateAndLocationPage.continue()

    const plannedEventsPage = Page.verifyOnPage(PlannedEventsPage)

    // Prisoner notes
    plannedEventsPage.appointmentLinkIsPresent('38314')
    plannedEventsPage.extraInfoTagIsPresent('38314')

    // Staff comments
    plannedEventsPage.appointmentLinkIsPresent('38315')
    plannedEventsPage.extraInfoTagIsPresent('38315')
  })
})
