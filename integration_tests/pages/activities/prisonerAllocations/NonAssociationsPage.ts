import Page from '../../page'

export default class NonAssociationsPage extends Page {
  constructor() {
    super('prisoner-allocations-non-associations')
  }

  getPrisonerName = (name: string): Cypress.Chainable => cy.contains(name)

  verifyMiniProfileDetails = (expectedDetails: { label: string; value: string }[]) => {
    cy.get('.mini-profile__details').within(() => {
      expectedDetails.forEach(({ label, value }) => {
        cy.contains('.mini-profile__detail-label', label)
          .next('.mini-profile__detail-value')
          .should('contain.text', value)
      })
    })
  }

  verifyMiniProfileLinks = (linkedLabels: string[]) => {
    cy.get('.mini-profile__details').within(() => {
      linkedLabels.forEach(label => {
        cy.contains('.mini-profile__detail-label', label)
          .next('.mini-profile__detail-value')
          .find('a')
          .should('have.attr', 'href')
      })
    })
  }

  verifyNonassociationDetails = (
    prisonerId: string,
    expectedValues: {
      name: string
      cellLocation: string
      allocations: string[]
      nonAssocDetails: string[]
      lastUpdated: string
    },
  ) => {
    cy.get('table thead th').then($headers => {
      const headers = $headers.toArray().map(th => th.innerText.trim())
      const columnIndexes = {
        name: headers.indexOf('Name'),
        cellLocation: headers.indexOf('Cell location'),
        allocations: headers.indexOf('Allocations'),
        nonAssocDetails: headers.indexOf('Non-association details'),
        lastUpdated: headers.indexOf('Last updated'),
      }

      cy.get('table tbody tr')
        .contains('td', prisonerId)
        .closest('tr')
        .within(() => {
          // Check name, cellLocation, lastUpdated
          cy.get('td').eq(columnIndexes.name).should('contain.text', expectedValues.name)

          cy.get('td').eq(columnIndexes.cellLocation).should('contain.text', expectedValues.cellLocation)

          cy.get('td').eq(columnIndexes.lastUpdated).should('contain.text', expectedValues.lastUpdated)

          // Check allocations (array of strings)
          cy.get('td')
            .eq(columnIndexes.allocations)
            .invoke('text')
            .then(text => {
              const normalizedText = text.replace(/\s+/g, ' ').trim()
              expectedValues.allocations.forEach(allocation => {
                const normalizedAllocation = allocation.replace(/\s+/g, ' ').trim()
                expect(normalizedText).to.include(
                  normalizedAllocation,
                  `Allocation "${allocation}" not found for prisoner ${prisonerId}`,
                )
              })
            })

          // Check non-association details (array of strings)
          cy.get('td')
            .eq(columnIndexes.nonAssocDetails)
            .invoke('text')
            .then(text => {
              const normalizedText = text.replace(/\s+/g, ' ').trim()
              const expectedText = expectedValues.nonAssocDetails.join(' ').replace(/\s+/g, ' ').trim()
              expect(normalizedText).to.include(
                expectedText,
                `Non-association details mismatch for prisoner ${prisonerId}`,
              )
            })
        })
    })
  }
}
