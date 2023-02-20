import Page from '../page'

export default class EducationLevelPage extends Page {
  constructor() {
    super('create-activity-education-level-page')
  }

  selectEducationLevel = (referenceCode: string) => this.getInputByName('referenceCode').select(referenceCode)

  reviewAndAddMoreEducationLevels = () => cy.get('button').contains('Review and add more education levels').click()
}
