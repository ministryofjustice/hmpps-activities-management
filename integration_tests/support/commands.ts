import { stubEndpoint, stubHealthPing } from '../mockApis/wiremock'
import 'cypress-file-upload'

import rolloutPlan from '../fixtures/activitiesApi/rollout.json'

Cypress.Commands.add('signIn', (options = { failOnStatusCode: true }) => {
  cy.request('/')
  cy.stubEndpoint('GET', '/rollout/MDI', rolloutPlan)
  return cy.task('getSignInUrl').then((url: string) => cy.visit(url, options))
})

Cypress.Commands.add(
  'stubEndpoint',
  (method: string, urlPattern: string, responseFixture?: JSON, responseStatus = 200) =>
    stubEndpoint(method, urlPattern, responseFixture, responseStatus),
)

Cypress.Commands.add('stubHealthPing', (urlPattern: string, responseStatus = 200) =>
  stubHealthPing(urlPattern, responseStatus),
)
