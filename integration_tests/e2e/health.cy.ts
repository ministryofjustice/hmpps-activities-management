context('Healthcheck', () => {
  context('All healthy', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.stubHealthPing('/auth/health/ping')
      cy.stubHealthPing('/verification/health/ping')
      cy.stubHealthPing('/health/ping')
      cy.stubHealthPing('/health')
    })

    it('Health check page is visible and UP', () => {
      cy.request('/health').its('body.status').should('equal', 'UP')
    })

    it('Ping is visible and UP', () => {
      cy.request('/ping').its('body.status').should('equal', 'UP')
    })
  })

  context('Some unhealthy', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.stubHealthPing('/auth/health/ping')
      cy.stubHealthPing('/health/ping')
      cy.stubHealthPing('/verification/health/ping', 500)
    })

    it('Reports correctly when token verification down', () => {
      cy.request({ url: '/health', method: 'GET', failOnStatusCode: false }).then(response => {
        expect(response.body.components.hmppsAuth.status).to.equal('UP')
        expect(response.body.components.incentivesApi.status).to.equal('UP')
        expect(response.body.components.tokenVerification.status).to.equal('DOWN')
        expect(response.body.components.tokenVerification.details).to.contain({ status: 500 })
      })
    })

    it('Health check page is visible and DOWN', () => {
      cy.request({ url: '/health', method: 'GET', failOnStatusCode: false }).its('body.status').should('equal', 'DOWN')
    })
  })
})
