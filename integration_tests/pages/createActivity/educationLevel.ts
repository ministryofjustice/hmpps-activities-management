import Page from '../page'

export default class EducationLevelPage extends Page {
  constructor() {
    super('create-activity-education-level-page')
  }

  selectStudyArea = (studyArea: string) => this.getInputById('studyAreaCode').type(studyArea)

  selectEducationLevel = (educationLevel: string) => this.getInputById('eduLevelCode').type(educationLevel)
}
