import stubEndpoint from '../mockApis/generic'

Cypress.Commands.add('signIn', (options = { failOnStatusCode: true }) => {
  cy.request('/')
  return cy.task('getSignInUrl').then((url: string) => cy.visit(url, options))
})

Cypress.Commands.add(
  'stubEndpoint',
  (method: string, urlPattern: string, responseFixture?: JSON, responseStatus = 200) =>
    stubEndpoint(method, urlPattern, responseFixture, responseStatus),
)
