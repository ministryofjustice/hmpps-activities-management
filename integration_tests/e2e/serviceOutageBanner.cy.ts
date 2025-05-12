context.skip('Service banner', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
  })

  // The app reads the environment variables at build time and not runtime, which means we can't set these var to true just for these tests. Therefore these tests will need running manually and for a particular use-case - the LIVE and PLANNED vars produce different banner content and therefore they can't be run together otherwise one will always fail

  it('Banner should show on homepage under the header bar when there is a live outage', () => {
    // To use this test, you must manually change the feature.env to LIVE_ISSUE_OUTAGE_BANNER_ENABLED=true
    cy.visit('/')
    cy.get('[data-qa="outage-banner"]').should('be.visible')
    cy.get('[data-qa="outage-banner"]').should('contain.text', 'Problems with the Activities service')
    cy.get('[data-qa="outage-banner"]').should(
      'contain.text',
      'We’re aware of problems with this service. We’re working on fixing them, but you may need to try again later.',
    )
  })
  it('Banner should show on homepage under the header bar when there is a planned outage', () => {
    // To use this test, you must manually change the feature.env to PLANNED_DOWNTIME_OUTAGE_BANNER_ENABLED=true and LIVE_ISSUE_OUTAGE_BANNER_ENABLED=false
    cy.visit('/')
    cy.get('[data-qa="outage-banner"]').should('be.visible')
    cy.get('[data-qa="outage-banner"]').should('contain.text', 'Important')
    cy.get('[data-qa="outage-banner"]').should(
      'contain.text',
      'The Activities service will be unavailable on Tuesday, 20 May 2025 between 9am and 11am.',
    )
  })
})
