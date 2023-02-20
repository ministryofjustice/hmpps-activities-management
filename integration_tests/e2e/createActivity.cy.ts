import IndexPage from '../pages/index'
import Page from '../pages/page'
import CategoryPage from '../pages/createActivity/category'
import ActivityNamePage from '../pages/createActivity/name'
import RiskLevelPage from '../pages/createActivity/riskLevel'
import PayPage from '../pages/createActivity/pay'
import CheckPayPage from '../pages/createActivity/checkPay'
import QualificationPage from '../pages/createActivity/qualification'
import EducationLevelPage from '../pages/createActivity/educationLevel'
import CheckEducationLevelsPage from '../pages/createActivity/checkEducationLevels'
import getCategories from '../fixtures/activitiesApi/getCategories.json'
import moorlandPayBands from '../fixtures/activitiesApi/getMdiPrisonPayBands.json'
import moorlandIncentiveLevels from '../fixtures/activitiesApi/getMdiPrisonIncentiveLevels.json'
import CheckAnswersPage from '../pages/createActivity/checkAnswers'
import ConfirmationPage from '../pages/createActivity/confirmation'

context('Change location', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')
    cy.signIn()
    cy.stubEndpoint('GET', '/activity-categories', getCategories)
    cy.stubEndpoint('GET', '/prison/MDI/prison-pay-bands', moorlandPayBands)
    cy.stubEndpoint('GET', '/iep/levels/MDI', moorlandIncentiveLevels)
    cy.stubEndpoint('POST', '/activities')
  })

  it('should click through create activity journey', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.createActivityCard().should('contain.text', 'Create a schedulable activity in your prison.')
    indexPage.createActivityCard().click()

    const categoryPage = Page.verifyOnPage(CategoryPage)
    categoryPage.selectCategory('Gym, sport and fitness')
    categoryPage.continue()

    const activityNamePage = Page.verifyOnPage(ActivityNamePage)
    activityNamePage.enterName('5-a-side Football')
    activityNamePage.continue()

    const riskLevelPage = Page.verifyOnPage(RiskLevelPage)
    riskLevelPage.selectRiskLevel('Only low workplace risk assessment is suitable')
    riskLevelPage.continue()

    const payPage = Page.verifyOnPage(PayPage)
    payPage.enterPayAmount('1.00')
    payPage.selectPayBand('Low')
    payPage.selectCheckboxes(['Basic', 'Standard', 'Enhanced'])
    payPage.reviewAndAddMoreRates()

    const checkPayPage = Page.verifyOnPage(CheckPayPage)
    checkPayPage.payRows().should('have.length', 3)
    checkPayPage.addAnother()

    const payPage2 = Page.verifyOnPage(PayPage)
    payPage2.enterPayAmount('1.50')
    payPage2.selectPayBand('Medium')
    payPage2.selectCheckboxes(['Basic'])
    payPage2.reviewAndAddMoreRates()

    const checkPayPage2 = Page.verifyOnPage(CheckPayPage)
    checkPayPage2.payRows().should('have.length', 4)
    checkPayPage2.confirmPayRates()

    const qualificationPage = Page.verifyOnPage(QualificationPage)
    qualificationPage.selectQualification('Yes')
    qualificationPage.continue()

    const educationLevelPage = Page.verifyOnPage(EducationLevelPage)
    educationLevelPage.selectEducationLevel('1')
    educationLevelPage.reviewAndAddMoreEducationLevels()

    const checkEducationLevelPage = Page.verifyOnPage(CheckEducationLevelsPage)
    checkEducationLevelPage.educationLevelRows().should('have.length', 1)
    checkEducationLevelPage.confirmEducationLevels()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.createActivity()

    Page.verifyOnPage(ConfirmationPage)
  })
})
