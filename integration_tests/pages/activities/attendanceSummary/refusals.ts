import Page from '../../page'

export default class RefusalsPage extends Page {
  constructor() {
    super('refused-to-attend-page')
  }

  title = () => cy.get('h1')

  numberOfRefusals = () => cy.get('h2')

  assertRow(rowNum, attendeeName, location, session, caseNoteType, link) {
    cy.get(`#attendee-list-table`)
      .eq(rowNum)
      .find('td')
      .then($data => {
        expect($data.get(0).innerText).to.contain(attendeeName)
        expect($data.get(1).innerText).to.contain(location)
        expect($data.get(2).innerText).to.contain(session)
        expect($data.get(3).innerText).to.contain(caseNoteType)
        expect($data.get(4).innerText).to.contain(link)
      })
  }
}
