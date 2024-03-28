import IndexPage from '../../pages'
import Page from '../../pages/page'
import getLocationGroups from '../../fixtures/activitiesApi/getLocationGroups.json'
import ActivitiesIndexPage from '../../pages/activities'
import UnlockAndMovementIndexPage from '../../pages/unlockAndMovements/unlockAndMovementDashboard'
import ChooseDateAndLocationPage from '../../pages/unlockAndMovements/chooseDateAndLocation'
import getPrisonPrisoners from '../../fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A1350DZ-A8644DY.json'
import getScheduledEvents from '../../fixtures/activitiesApi/getScheduleEvents-MDI-A1350DZ-A8644DY.json'
import PlannedEventsPage from '../../pages/unlockAndMovements/plannedEventsPage'

const catABadge = { clazz: 'cat-a-status--a', text: 'CAT A' }
const peepBadge = { clazz: 'alert-status--disability', text: 'PEEP' }
const controlledUnlockBadge = { clazz: 'alert-status--controlled-unlock', text: 'Controlled Unlock' }
context('Create activity', () => {
  const locPrefixBlock1 = 'MDI-1-.+'
  const locPrefixBlock2AWing = 'MDI-1-1-0(0[1-9]|1[0-2]),MDI-1-2-0(0[1-9]|1[0-2]),MDI-1-3-0(0[1-9]|1[0-2])'
  const locPrefixBlock2BWing = 'MDI-1-1-0(1[3-9]|2[0-6]),MDI-1-2-0(1[3-9]|2[0-6]),MDI-1-3-0(1[3-9]|2[0-6])'
  const locPrefixBlock2CWing = 'MDI-1-1-0(2[7-9]|3[0-8]),MDI-1-2-0(2[7-9]|3[0-8]),MDI-1-3-0(2[7-9]|3[0-8])'

  const toLocPrefix = (prefix: string) => JSON.parse(`{"locationPrefix": "${prefix}"}`)

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
    cy.stubEndpoint('POST', '/scheduled-events/prison/MDI\\?date=2024-03-28&timeSlot=am', getScheduledEvents)
  })

  it('should show correct alerts', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().should('contain.text', 'Activities, unlock and attendance')
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.unlockAndMovementCard().should('contain.text', 'Manage unlock and movement')
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
    plannedEventsPage.assertBadges(0, controlledUnlockBadge, peepBadge)
    plannedEventsPage.assertBadges(1, catABadge, controlledUnlockBadge)

    plannedEventsPage.getButton('Show filter').click()
    plannedEventsPage.acctAlertCheckbox().should('be.checked')
    plannedEventsPage.controlledUnlockAlertCheckbox().should('be.checked')
    plannedEventsPage.eListAlertCheckbox().should('be.checked')
    plannedEventsPage.peepAlertCheckbox().should('be.checked')
    plannedEventsPage.catAAlertCheckbox().should('be.checked')
    plannedEventsPage.catAHigherAlertCheckbox().should('be.checked')
    plannedEventsPage.catAProvisionalAlertCheckbox().should('be.checked')

    plannedEventsPage.controlledUnlockAlertCheckbox().uncheck()
    plannedEventsPage.getButton('Apply filters').eq(0).click()

    plannedEventsPage.assertBadges(0, peepBadge)
    plannedEventsPage.assertBadges(1, catABadge)

    plannedEventsPage.getButton('Show filter').click()
    plannedEventsPage.acctAlertCheckbox().should('be.checked')
    plannedEventsPage.controlledUnlockAlertCheckbox().should('not.be.checked')
    plannedEventsPage.eListAlertCheckbox().should('be.checked')
    plannedEventsPage.peepAlertCheckbox().should('be.checked')
    plannedEventsPage.catAAlertCheckbox().should('be.checked')
    plannedEventsPage.catAHigherAlertCheckbox().should('be.checked')
    plannedEventsPage.catAProvisionalAlertCheckbox().should('be.checked')

    plannedEventsPage.selectAllAlerts().click()
    plannedEventsPage.getButton('Apply filters').eq(0).click()
    plannedEventsPage.assertBadges(0, controlledUnlockBadge, peepBadge)
    plannedEventsPage.assertBadges(1, catABadge, controlledUnlockBadge)

    plannedEventsPage.getButton('Show filter').click()
    plannedEventsPage.selectAllAlerts().click()
    plannedEventsPage.acctAlertCheckbox().should('not.be.checked')
    plannedEventsPage.controlledUnlockAlertCheckbox().should('not.be.checked')
    plannedEventsPage.eListAlertCheckbox().should('not.be.checked')
    plannedEventsPage.peepAlertCheckbox().should('not.be.checked')
    plannedEventsPage.catAAlertCheckbox().should('not.be.checked')
    plannedEventsPage.catAHigherAlertCheckbox().should('not.be.checked')
    plannedEventsPage.catAProvisionalAlertCheckbox().should('not.be.checked')

    plannedEventsPage.getButton('Apply filters').eq(0).click()

    plannedEventsPage.relevantAlertColumn().should('not.exist')
  })
})
