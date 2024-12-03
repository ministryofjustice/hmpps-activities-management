context('Healthcheck', () => {
  context('All healthy', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.stubHealthPing('/auth/health/ping')
      cy.stubHealthPing('/verification/health/ping')
      cy.stubHealthPing('/health/ping')
      cy.stubHealthPing('/health')
    })

    it('Health check page is visible', () => {
      cy.request('/health').its('body.healthy').should('equal', true)
    })

    it('Ping is visible and UP', () => {
      cy.request('/ping').its('body.status').should('equal', 'UP')
    })
  })

  context('Some unhealthy', () => {
    it('Reports correctly when token verification down', () => {
      cy.task('reset')
      cy.stubHealthPing('/auth/health/ping')
      cy.stubHealthPing('/verification/health/ping', 500)
      cy.stubHealthPing('/health/ping')
      cy.stubHealthPing('/health')

      cy.request({ url: '/health', method: 'GET', failOnStatusCode: false }).then(response => {
        expect(response.body.checks.hmppsAuth).to.equal('OK')
        expect(response.body.checks.activitiesApi).to.equal('OK')
        expect(response.body.checks.caseNotesApi).to.equal('OK')
        expect(response.body.checks.prisonApi).to.equal('OK')
        expect(response.body.checks.prisonerSearchApi).to.equal('OK')
        expect(response.body.checks.incentivesApi).to.equal('OK')
        expect(response.body.checks.frontendComponents).to.equal('OK')
        expect(response.body.checks.prisonRegisterApi).to.equal('OK')
        expect(response.body.checks.manageUsersApi).to.equal('OK')
        expect(response.body.checks.bookAVideoLinkApi).to.equal('OK')
        expect(response.body.checks.nonAssociationsApi).to.equal('OK')
        expect(response.body.checks.locationsInsidePrisonApi).to.equal('OK')
        expect(response.body.checks.nomisMapping).to.equal('OK')
        expect(response.body.checks.tokenVerification).to.contain({ status: 500, retries: 2 })
      })
    })
  })
})
