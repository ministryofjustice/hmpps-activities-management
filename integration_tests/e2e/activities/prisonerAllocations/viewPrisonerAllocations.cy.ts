context('Waitlist', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
  })

  xit('Should be able to visit a prisoners allocations page', () => {
    cy.visit('/activities/prisoner-allocations/A1350DZ')
  })
})
