declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to signIn. Set failOnStatusCode to false if you expect a non 200 return code
     * @example cy.signIn({ failOnStatusCode: boolean })
     */
    signIn(options?: { failOnStatusCode: boolean }): Chainable<AUTWindow>

    /**
     * Custom command to stub an endpoint with wiremock.
     * @example cy.stubEndpoint('GET', '/', { "response": "Hello, World!" }, 200)
     */
    stubEndpoint(
      method: string,
      urlPattern: string,
      responseFixture?: JSON,
      responseStatus?: number,
    ): Chainable<AUTWindow>
  }
}
