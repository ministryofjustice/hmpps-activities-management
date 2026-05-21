import Page from '../../pages/page'
import moorlandIncentiveLevels from '../../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import getActivity from '../../fixtures/activitiesApi/getActivity.json'
import ViewActivityPage from '../../pages/createActivity/viewActivity'

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

context('View activity', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')

    const getActivityOutside = { ...getActivity }
    getActivityOutside.id = 3
    getActivityOutside.outsideWork = true

    cy.stubEndpoint('GET', '/activities/2/filtered', getActivity as unknown as JSON)
    cy.stubEndpoint('GET', '/activities/3/filtered', getActivityOutside as unknown as JSON)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', inmateDetails)
    cy.stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels)
  })

  it('internal activity in non-EA enabled prison shows as internal', () => {
    cy.signIn()
    cy.visit('/activities/view/2')

    const viewActivityPage = Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.isInPrisonActivity()
  })

  it('external activity in non-EA enabled prison shows as internal', () => {
    cy.signIn()
    cy.visit('/activities/view/3')

    const viewActivityPage = Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.isInPrisonActivity()
  })

  it('internal activity in EA enabled prison shows as internal', () => {
    cy.signInEAEnabled()
    cy.visit('/activities/view/2')

    const viewActivityPage = Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.isInPrisonActivity()
  })

  it('external activity in EA enabled prison shows as external', () => {
    cy.signInEAEnabled()
    cy.visit('/activities/view/3')

    const viewActivityPage = Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.isOutsideActivity()
  })
})
