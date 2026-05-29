import getInmateDetails from '../../fixtures/prisonerSearchApi/getPrisoner-MDI-A5015DY.json'
import ExclusionsViewAllocations from '../../pages/activities/exclusionsViewAllocations'
import ViewSuspensionPage from '../../pages/activities/suspensions/viewSuspension'
import prisonerAllocationsExclusions from '../../fixtures/activitiesApi/prisonerAllocationsExclusions.json'
import getScheduleMaths from '../../fixtures/activitiesApi/getScheduleMaths.json'
import getScheduleGym from '../../fixtures/activitiesApi/getScheduleGym.json'
import getSchedulePlastering from '../../fixtures/activitiesApi/getSchedulePlastering.json'
import Page from '../../pages/page'
import getActivityMaths from '../../fixtures/activitiesApi/getActivityMaths.json'
import ExclusionsPage from '../../pages/allocateToActivity/exclusions'
import getPrisonRegime from '../../fixtures/activitiesApi/getPrisonRegime.json'
import ConfirmExclusionsPage from '../../pages/allocateToActivity/confirmExclusionsPage'

context('Exclusions', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.stubEndpoint('GET', '/prisoner/A5015DY', getInmateDetails)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocationsExclusions)
    cy.stubEndpoint('GET', '/schedules/1', getScheduleGym as unknown as JSON)
    cy.stubEndpoint('GET', '/schedules/2', getScheduleMaths as unknown as JSON)
    cy.stubEndpoint('GET', '/schedules/3', getSchedulePlastering as unknown as JSON)
    cy.stubEndpoint('GET', '/allocations/id/2', {
      ...prisonerAllocationsExclusions[0].allocations[0],
      exclusions: [],
    })
    cy.stubEndpoint('GET', '/activities/1/filtered', getActivityMaths)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails)
    cy.stubEndpoint('GET', '/prison/prison-regime/MDI', getPrisonRegime)
    cy.signIn()
  })
  it('should render the exclusions page', () => {
    cy.visit('/activities/exclusions/prisoner/A5015DY')

    const exclusionsAllocationsPage = Page.verifyOnPage(ExclusionsViewAllocations)
    exclusionsAllocationsPage.suspensionBadge().should('have.lengthOf', 2)
    exclusionsAllocationsPage.viewSuspendedLinks().should('have.lengthOf', 2)
  })

  it('should take you to the edit exclusions page', () => {
    cy.visit('/activities/exclusions/prisoner/A5015DY')

    const exclusionsAllocationsPage = Page.verifyOnPage(ExclusionsViewAllocations)
    exclusionsAllocationsPage.changeLink(1).click()

    // This page is tested in editAllocationToActivity.cy.ts, we just want to check that the link takes us here.
    const exclusionsPage = Page.verifyOnPage(ExclusionsPage)
    exclusionsPage.continue()

    const confirmationPage = Page.verifyOnPage(ConfirmExclusionsPage)
    confirmationPage.confirm()

    // Check 'confirm' routes us back to the exclusions page
    Page.verifyOnPage(ExclusionsViewAllocations)
  })

  it('should take you to the manage suspension page', () => {
    cy.visit('/activities/exclusions/prisoner/A5015DY')

    const exclusionsAllocationsPage = Page.verifyOnPage(ExclusionsViewAllocations)
    exclusionsAllocationsPage.viewSuspendedLinks().should('have.lengthOf', 2).invoke('removeAttr', 'target')
    exclusionsAllocationsPage.firstSuspensionLink()

    const viewSuspensionPage = Page.verifyOnPage(ViewSuspensionPage)
    viewSuspensionPage
      .summary()
      .find('dt')
      .then($dt => {
        expect($dt.get(0).innerText).to.contain('Activity')
        expect($dt.get(1).innerText).to.contain('First day of suspension')
        expect($dt.get(2).innerText).to.contain('Last day of suspension')
        expect($dt.get(3).innerText).to.contain('Paid while suspended?')
        expect($dt.get(4).innerText).to.contain('Added by')
      })
    viewSuspensionPage
      .summary()
      .find('dd')
      .then($dd => {
        expect($dd.get(0).innerText).to.contain('Gym')
        expect($dd.get(1).innerText).to.contain('Friday, 13 December 2024')
        expect($dd.get(2).innerText).to.contain('No end date')
        expect($dd.get(3).innerText).to.contain('Yes')
      })
  })
})
