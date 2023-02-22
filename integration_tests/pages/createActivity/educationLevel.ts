import Page from '../page'

export default class EducationLevelPage extends Page {
  constructor() {
    super('create-activity-education-level-page')
  }

  selectEducationLevel = (educationLevel: string) => this.getInputById('referenceCode').type(educationLevel)

  reviewAndAddMoreEducationLevels = () => cy.get('button').contains('Review and add more education levels').click()
}
