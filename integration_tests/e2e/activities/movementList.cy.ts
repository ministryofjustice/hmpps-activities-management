import { format, startOfToday } from 'date-fns'
import IndexPage from '../../pages'
import Page from '../../pages/page'
import getInteralLocationEvents from '../../fixtures/activitiesApi/getInteralLocationEvents.json'
import ActivitiesIndexPage from '../../pages/activities'
import UnlockAndMovementIndexPage from '../../pages/unlockAndMovements/unlockAndMovementDashboard'
import ChooseDetailsPage from '../../pages/unlockAndMovements/movement/chooseDetails'
import LocationsPage from '../../pages/unlockAndMovements/movement/locations'
import getScheduledEventLocations from '../../fixtures/activitiesApi/getScheduledEventLocations.json'
import getInmateDetails from '../../fixtures/prisonerSearchApi/getInmateDetailsForMovementList.json'
import getScheduledEvents from '../../fixtures/activitiesApi/getScheduleEvents-MDI-A1350DZ-A8644DY.json'
import LocationEventsPage from '../../pages/unlockAndMovements/movement/locationEventsPage'
import { CAT_A_BADGE, CONTROLLED_UNLOCK_BADGE, PEEP_BADGE } from '../../pages/unlockAndMovements/abstractEventsPage'

context('Create activity', () => {
  const today = format(startOfToday(), 'yyyy-MM-dd')

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
    cy.stubEndpoint(
      'GET',
      `/locations/prison/MDI/events-summaries\\?date=${today}&timeSlot=am`,
      getInteralLocationEvents,
    )
    cy.stubEndpoint(
      'POST',
      `/scheduled-events/prison/MDI/locations\\?date=${today}&timeSlot=am`,
      getScheduledEventLocations,
    )
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails)
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${today}`, getScheduledEvents)
  })

  it('should show correct alerts', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().should('contain.text', 'Activities, unlock and attendance')
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.unlockAndMovementCard().should('contain.text', 'Manage unlock and movement')
    activitiesIndexPage.unlockAndMovementCard().click()

    const manageActivitiesPage = Page.verifyOnPage(UnlockAndMovementIndexPage)
    manageActivitiesPage.createMovementListsCard().should('contain.text', 'Create movement lists')
    manageActivitiesPage.createMovementListsCard().click()

    const chooseMovementListDetailsPage = Page.verifyOnPage(ChooseDetailsPage)
    chooseMovementListDetailsPage.selectToday()
    chooseMovementListDetailsPage.selectAM()
    chooseMovementListDetailsPage.continue()

    const locationsPage = Page.verifyOnPage(LocationsPage)
    locationsPage.selectLocation('Workshop 1').click()

    const locationEventsPage = Page.verifyOnPage(LocationEventsPage)
    locationEventsPage.assertBadges(0, CONTROLLED_UNLOCK_BADGE, PEEP_BADGE)
    locationEventsPage.assertBadges(1, CAT_A_BADGE, CONTROLLED_UNLOCK_BADGE)

    locationEventsPage.getButton('Show filter').click()
    locationEventsPage.acctAlertCheckbox().should('be.checked')
    locationEventsPage.controlledUnlockAlertCheckbox().should('be.checked')
    locationEventsPage.eListAlertCheckbox().should('be.checked')
    locationEventsPage.peepAlertCheckbox().should('be.checked')
    locationEventsPage.catAAlertCheckbox().should('be.checked')
    locationEventsPage.catAHigherAlertCheckbox().should('be.checked')
    locationEventsPage.catAProvisionalAlertCheckbox().should('be.checked')

    locationEventsPage.controlledUnlockAlertCheckbox().uncheck()
    locationEventsPage.getButton('Apply filters').eq(0).click()

    locationEventsPage.assertBadges(0, PEEP_BADGE)
    locationEventsPage.assertBadges(1, CAT_A_BADGE)

    locationEventsPage.getButton('Show filter').click()
    locationEventsPage.acctAlertCheckbox().should('be.checked')
    locationEventsPage.controlledUnlockAlertCheckbox().should('not.be.checked')
    locationEventsPage.eListAlertCheckbox().should('be.checked')
    locationEventsPage.peepAlertCheckbox().should('be.checked')
    locationEventsPage.catAAlertCheckbox().should('be.checked')
    locationEventsPage.catAHigherAlertCheckbox().should('be.checked')
    locationEventsPage.catAProvisionalAlertCheckbox().should('be.checked')

    locationEventsPage.selectAllAlerts().click()
    locationEventsPage.getButton('Apply filters').eq(0).click()
    locationEventsPage.assertBadges(0, CONTROLLED_UNLOCK_BADGE, PEEP_BADGE)
    locationEventsPage.assertBadges(1, CAT_A_BADGE, CONTROLLED_UNLOCK_BADGE)

    locationEventsPage.getButton('Show filter').click()
    locationEventsPage.selectAllAlerts().click()
    locationEventsPage.acctAlertCheckbox().should('not.be.checked')
    locationEventsPage.controlledUnlockAlertCheckbox().should('not.be.checked')
    locationEventsPage.eListAlertCheckbox().should('not.be.checked')
    locationEventsPage.peepAlertCheckbox().should('not.be.checked')
    locationEventsPage.catAAlertCheckbox().should('not.be.checked')
    locationEventsPage.catAHigherAlertCheckbox().should('not.be.checked')
    locationEventsPage.catAProvisionalAlertCheckbox().should('not.be.checked')

    locationEventsPage.getButton('Apply filters').eq(0).click()

    locationEventsPage.relevantAlertColumn().should('not.exist')
  })
})
