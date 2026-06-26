import { addDays, format, startOfToday } from 'date-fns'
import Page from '../../pages/page'
import getInteralLocationEvents from '../../fixtures/activitiesApi/getInteralLocationEvents.json'
import UnlockAndMovementIndexPage from '../../pages/unlockAndMovements/unlockAndMovementDashboard'
import ChooseDetailsPage from '../../pages/unlockAndMovements/movement/chooseDetails'
import LocationsPage from '../../pages/unlockAndMovements/movement/locations'
import externalMovements from '../../fixtures/activitiesApi/externalMovements.json'
import getInternalLocationEventsByDpsLocationId from '../../fixtures/activitiesApi/getInternalLocationEventsByDpsLocationId.json'
import getScheduledEventLocationsAWing from '../../fixtures/activitiesApi/getInternalLocationEventsByDpsLocationId-A-wing.json'
import getInmateDetails from '../../fixtures/prisonerSearchApi/getInmateDetailsForMovementList.json'
import getScheduledEvents from '../../fixtures/activitiesApi/getScheduleEvents-MDI-A1350DZ-A8644DY.json'
import LocationEventsPage from '../../pages/unlockAndMovements/movement/locationEventsPage'
import { CAT_A_BADGE, CONTROLLED_UNLOCK_BADGE, PEEP_BADGE } from '../../pages/unlockAndMovements/abstractEventsPage'
import { InternalLocationEvents } from '../../../server/@types/activitiesAPI/types'

context('Movement list', () => {
  const today = format(startOfToday(), 'yyyy-MM-dd')
  const tomorrow = format(addDays(startOfToday(), 1), 'yyyy-MM-dd')

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')

    cy.stubEndpoint(
      'GET',
      `/locations/prison/MDI/events-summaries\\?date=${today}&timeSlot=AM`,
      getInteralLocationEvents,
    )
    cy.stubEndpoint(
      'GET',
      `/scheduled-events/prison/MDI/location-events\\?date=${today}&timeSlot=AM&dpsLocationId=11111111-1111-1111-1111-111111111111`,
      getInternalLocationEventsByDpsLocationId as unknown as JSON,
    )
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails)
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${today}`, getScheduledEvents as unknown as JSON)
  })

  it('should show correct alerts', () => {
    cy.signIn()
    cy.visit('/activities/unlock-list')

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
    locationEventsPage.cancelledBadge().should('have.lengthOf', 1)

    locationEventsPage.getButton('Show filter').click()
    locationEventsPage.acctAlertCheckbox().should('be.checked')
    locationEventsPage.controlledUnlockAlertCheckbox().should('be.checked')
    locationEventsPage.eListAlertCheckbox().should('be.checked')
    locationEventsPage.peepAlertCheckbox().should('be.checked')
    locationEventsPage.tactAlertCheckbox().should('be.checked')
    locationEventsPage.catAAlertCheckbox().should('be.checked')
    locationEventsPage.catAHigherAlertCheckbox().should('be.checked')
    locationEventsPage.catAProvisionalAlertCheckbox().should('be.checked')

    locationEventsPage.controlledUnlockAlertCheckbox().uncheck()
    locationEventsPage.getButton('Apply filters').eq(0).click()

    locationEventsPage.assertBadges(0, PEEP_BADGE)
    locationEventsPage.assertBadges(1, CAT_A_BADGE)
    locationEventsPage.cancelledBadge().should('have.lengthOf', 1)

    locationEventsPage.getButton('Show filter').click()
    locationEventsPage.acctAlertCheckbox().should('be.checked')
    locationEventsPage.controlledUnlockAlertCheckbox().should('not.be.checked')
    locationEventsPage.eListAlertCheckbox().should('be.checked')
    locationEventsPage.peepAlertCheckbox().should('be.checked')
    locationEventsPage.tactAlertCheckbox().should('be.checked')
    locationEventsPage.catAAlertCheckbox().should('be.checked')
    locationEventsPage.catAHigherAlertCheckbox().should('be.checked')
    locationEventsPage.catAProvisionalAlertCheckbox().should('be.checked')
    locationEventsPage.cancelledFilter().should('be.checked')

    locationEventsPage.selectAllAlerts().click()
    locationEventsPage.getButton('Apply filters').eq(0).click()
    locationEventsPage.assertBadges(0, CONTROLLED_UNLOCK_BADGE, PEEP_BADGE)
    locationEventsPage.assertBadges(1, CAT_A_BADGE, CONTROLLED_UNLOCK_BADGE)
    locationEventsPage.cancelledBadge().should('have.lengthOf', 1)

    locationEventsPage.getButton('Show filter').click()
    locationEventsPage.selectAllAlerts().click()
    locationEventsPage.acctAlertCheckbox().should('not.be.checked')
    locationEventsPage.controlledUnlockAlertCheckbox().should('not.be.checked')
    locationEventsPage.eListAlertCheckbox().should('not.be.checked')
    locationEventsPage.peepAlertCheckbox().should('not.be.checked')
    locationEventsPage.tactAlertCheckbox().should('not.be.checked')
    locationEventsPage.catAAlertCheckbox().should('not.be.checked')
    locationEventsPage.catAHigherAlertCheckbox().should('not.be.checked')
    locationEventsPage.catAProvisionalAlertCheckbox().should('not.be.checked')
    locationEventsPage.getButton('Apply filters').eq(0).click()
    locationEventsPage.relevantAlertColumn().should('not.exist')
  })

  it('should filter out cancelled sessions', () => {
    cy.signIn()
    cy.visit('/activities/unlock-list')

    const manageActivitiesPage = Page.verifyOnPage(UnlockAndMovementIndexPage)
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
    locationEventsPage.cancelledBadge().should('have.lengthOf', 1)

    locationEventsPage.getButton('Show filter').click()
    locationEventsPage.acctAlertCheckbox().should('be.checked')
    locationEventsPage.controlledUnlockAlertCheckbox().should('be.checked')
    locationEventsPage.eListAlertCheckbox().should('be.checked')
    locationEventsPage.peepAlertCheckbox().should('be.checked')
    locationEventsPage.tactAlertCheckbox().should('be.checked')
    locationEventsPage.catAAlertCheckbox().should('be.checked')
    locationEventsPage.catAHigherAlertCheckbox().should('be.checked')
    locationEventsPage.catAProvisionalAlertCheckbox().should('be.checked')
    locationEventsPage.selectNoCancelledEvents().click()
    locationEventsPage.getButton('Apply filters').eq(0).click()
    cy.get('tbody>tr').should('have.length', 1)
  })

  it('shows the not required tag if a prisoner has been marked as not required for unlock today, but not if the prisoner is already suspended', () => {
    const getScheduledEventsWithNotRequired: InternalLocationEvents = { ...getInternalLocationEventsByDpsLocationId }
    getScheduledEventsWithNotRequired.events[0].attendanceStatus = 'COMPLETED'
    getScheduledEventsWithNotRequired.events[0].attendanceReasonCode = 'NOT_REQUIRED'
    getScheduledEventsWithNotRequired.events[1].attendanceStatus = 'COMPLETED'
    getScheduledEventsWithNotRequired.events[1].attendanceReasonCode = 'NOT_REQUIRED'
    getScheduledEventsWithNotRequired.events[1].suspended = true
    cy.stubEndpoint(
      'GET',
      `/scheduled-events/prison/MDI/location-events\\?date=${today}&timeSlot=AM&dpsLocationId=11111111-1111-1111-1111-111111111111`,
      getScheduledEventsWithNotRequired as unknown as JSON,
    )

    cy.signIn()
    cy.visit('/activities/unlock-list')

    const manageActivitiesPage = Page.verifyOnPage(UnlockAndMovementIndexPage)
    manageActivitiesPage.createMovementListsCard().click()

    const chooseMovementListDetailsPage = Page.verifyOnPage(ChooseDetailsPage)
    chooseMovementListDetailsPage.selectToday()
    chooseMovementListDetailsPage.selectAM()
    chooseMovementListDetailsPage.continue()

    const locationsPage = Page.verifyOnPage(LocationsPage)
    locationsPage.selectLocation('Workshop 1').click()

    const locationEventsPage = Page.verifyOnPage(LocationEventsPage)

    locationEventsPage
      .table()
      .find('td')
      .then(data => {
        expect(data.get(11).innerText).to.contain('Woodworking')
        expect(data.get(11).innerText).to.contain('Not required')
        expect(data.get(4).innerText).to.contain('Pottery')
        expect(data.get(4).innerText).to.contain('Prisoner suspended')
        expect(data.get(4).innerText).to.not.contain('Not required')
      })
  })

  it('shows the not required tag if a prisoner has been marked as not required for unlock tomorrow', () => {
    const getScheduledEventsWithNotRequired: InternalLocationEvents = { ...getInternalLocationEventsByDpsLocationId }
    getScheduledEventsWithNotRequired.events[0].date = tomorrow
    getScheduledEventsWithNotRequired.events[0].attendanceStatus = null
    getScheduledEventsWithNotRequired.events[0].attendanceReasonCode = 'NOT_REQUIRED'
    cy.stubEndpoint(
      'GET',
      `/locations/prison/MDI/events-summaries\\?date=${tomorrow}&timeSlot=AM`,
      getInteralLocationEvents,
    )
    cy.stubEndpoint(
      'GET',
      `/scheduled-events/prison/MDI/location-events\\?date=${tomorrow}&timeSlot=AM&dpsLocationId=11111111-1111-1111-1111-111111111111`,
      getScheduledEventsWithNotRequired as unknown as JSON,
    )
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${tomorrow}`, getScheduledEvents as unknown as JSON)

    cy.signIn()
    cy.visit('/activities/unlock-list')

    const manageActivitiesPage = Page.verifyOnPage(UnlockAndMovementIndexPage)
    manageActivitiesPage.createMovementListsCard().click()

    const chooseMovementListDetailsPage = Page.verifyOnPage(ChooseDetailsPage)
    chooseMovementListDetailsPage.selectTomorrow()
    chooseMovementListDetailsPage.selectAM()
    chooseMovementListDetailsPage.continue()

    const locationsPage = Page.verifyOnPage(LocationsPage)
    locationsPage.selectLocation('Workshop 1').click()

    const locationEventsPage = Page.verifyOnPage(LocationEventsPage)

    locationEventsPage
      .table()
      .find('td')
      .then(data => {
        expect(data.get(11).innerText).to.contain('Woodworking')
        expect(data.get(11).innerText).to.contain('Not required')
      })
  })

  it('should show extra information tag for appointments with comments', () => {
    cy.stubEndpoint(
      'GET',
      `/scheduled-events/prison/MDI/location-events\\?date=${today}&timeSlot=AM&dpsLocationId=33333333-3333-3333-3333-333333333333`,
      getScheduledEventLocationsAWing as unknown as JSON,
    )

    cy.signIn()
    cy.visit('/activities/unlock-list')

    const manageActivitiesPage = Page.verifyOnPage(UnlockAndMovementIndexPage)
    manageActivitiesPage.createMovementListsCard().click()

    const chooseMovementListDetailsPage = Page.verifyOnPage(ChooseDetailsPage)
    chooseMovementListDetailsPage.selectToday()
    chooseMovementListDetailsPage.selectAM()
    chooseMovementListDetailsPage.continue()

    const locationsPage = Page.verifyOnPage(LocationsPage)
    locationsPage.selectLocation('A Wing').click()

    const locationEventsPage = Page.verifyOnPage(LocationEventsPage)

    // Staff comments
    locationEventsPage.appointmentLinkIsPresent('1')
    locationEventsPage.extraInfoTagIsPresent('1')

    // Prisoner comments
    locationEventsPage.appointmentLinkIsPresent('2')
    locationEventsPage.extraInfoTagIsPresent('2')
  })

  it('should show outside movement list', () => {
    cy.stubEndpoint(
      'GET',
      `/scheduled-events/prison/MDI/scheduled-external-movements\\?date=${today}&timeSlot=AM`,
      externalMovements as unknown as JSON,
    )
    cy.signInEAEnabled()
    cy.visit('/activities/unlock-list')

    const manageActivitiesPage = Page.verifyOnPage(UnlockAndMovementIndexPage)
    manageActivitiesPage.createMovementListsCard().click()

    const chooseMovementListDetailsPage = Page.verifyOnPage(ChooseDetailsPage)
    chooseMovementListDetailsPage.selectToday()
    chooseMovementListDetailsPage.selectAM()
    chooseMovementListDetailsPage.continue()

    const locationsPage = Page.verifyOnPage(LocationsPage)
    locationsPage.selectLocation('Outside').click()

    const locationEventsPage = Page.verifyOnPage(LocationEventsPage)
    locationEventsPage.heading().contains('Outside - movement list')
    locationEventsPage.peopleCount().contains('2 people going out')
    locationEventsPage
      .table()
      .find('tbody')
      .find('tr')
      .each(row => {
        cy.wrap(row).find('td').eq(4).should('contain.text', 'Outside')
      })
    locationEventsPage.table().find('tbody').find('tr').contains('Cancelled')
  })

  it('should message if no outside movements are scheduled', () => {
    cy.stubEndpoint('GET', `/scheduled-events/prison/MDI/scheduled-external-movements\\?date=${today}&timeSlot=AM`, {} as unknown as JSON)
    cy.signInEAEnabled()
    cy.visit('/activities/unlock-list')

    const manageActivitiesPage = Page.verifyOnPage(UnlockAndMovementIndexPage)
    manageActivitiesPage.createMovementListsCard().click()

    const chooseMovementListDetailsPage = Page.verifyOnPage(ChooseDetailsPage)
    chooseMovementListDetailsPage.selectToday()
    chooseMovementListDetailsPage.selectAM()
    chooseMovementListDetailsPage.continue()

    const locationsPage = Page.verifyOnPage(LocationsPage)
    locationsPage.selectLocation('Outside').click()

    const locationEventsPage = Page.verifyOnPage(LocationEventsPage)
    locationEventsPage.heading().contains('Outside - movement list')
    locationEventsPage.noOutsideMovementsMessage().should('be.visible')
  })
})
