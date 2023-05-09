import { addMonths } from 'date-fns'
import IndexPage from '../pages/index'
import Page from '../pages/page'
import CategoryPage from '../pages/createActivity/category'
import ActivityNamePage from '../pages/createActivity/name'
import RiskLevelPage from '../pages/createActivity/riskLevel'
import PayRateTypePage from '../pages/createActivity/payRateType'
import PayPage from '../pages/createActivity/pay'
import CheckPayPage from '../pages/createActivity/checkPay'
import QualificationPage from '../pages/createActivity/qualification'
import EducationLevelPage from '../pages/createActivity/educationLevel'
import CheckEducationLevelsPage from '../pages/createActivity/checkEducationLevels'
import getCategories from '../fixtures/activitiesApi/getCategories.json'
import moorlandPayBands from '../fixtures/activitiesApi/getMdiPrisonPayBands.json'
import moorlandIncentiveLevels from '../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import educationLevels from '../fixtures/prisonApi/educationLevels.json'
import CheckAnswersPage from '../pages/createActivity/checkAnswers'
import ConfirmationPage from '../pages/createActivity/confirmation'
import getEventLocations from '../fixtures/prisonApi/getEventLocations.json'
import getPayProfile from '../fixtures/prisonApi/getPayProfile.json'
import StartDatePage from '../pages/createSchedule/startDate'
import EndDateOptionPage from '../pages/createSchedule/endDateOption'
import EndDatePage from '../pages/createSchedule/endDate'
import DaysAndTimesPage from '../pages/createSchedule/daysAndTimes'
import BankHolidayPage from '../pages/createSchedule/bankHoliday'
import LocationPage from '../pages/createSchedule/location'
import CapacityPage from '../pages/createSchedule/capacity'

context('Create activity', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')
    cy.signIn()
    cy.stubEndpoint('GET', '/activity-categories', getCategories)
    cy.stubEndpoint('GET', '/prison/MDI/prison-pay-bands', moorlandPayBands)
    cy.stubEndpoint('GET', '/iep/levels/MDI', moorlandIncentiveLevels)
    cy.stubEndpoint('GET', '/api/reference-domains/domains/EDU_LEVEL/codes', educationLevels)
    cy.stubEndpoint('GET', '/api/agencies/MDI/eventLocations', getEventLocations)
    cy.stubEndpoint('GET', '/api/agencies/MDI/pay-profile', getPayProfile)
    cy.stubEndpoint('POST', '/activities', JSON.parse('{"schedules": [{"id": 1}]}'))
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

    const payRateTypePage = Page.verifyOnPage(PayRateTypePage)
    payRateTypePage.payRateType('A single pay rate for one incentive level')
    payRateTypePage.continue()

    const payPage = Page.verifyOnPage(PayPage)
    payPage.enterPayAmount('1.00')
    payPage.selectPayBand('Low')
    payPage.incentiveLevel('Basic')
    payPage.reviewAndAddMoreRates()

    const checkPayPage = Page.verifyOnPage(CheckPayPage)
    checkPayPage.payRows().should('have.length', 1)
    checkPayPage.addAnother()

    const payRateTypePage2 = Page.verifyOnPage(PayRateTypePage)
    payRateTypePage2.payRateType('A single pay rate for one incentive level')
    payRateTypePage2.continue()

    const payPage2 = Page.verifyOnPage(PayPage)
    payPage2.enterPayAmount('1.50')
    payPage2.selectPayBand('Medium')
    payPage2.incentiveLevel('Basic')
    payPage2.reviewAndAddMoreRates()

    const checkPayPage2 = Page.verifyOnPage(CheckPayPage)
    checkPayPage2.payRows().should('have.length', 2)
    checkPayPage2.confirmPayRates()

    const qualificationPage = Page.verifyOnPage(QualificationPage)
    qualificationPage.selectQualification('Yes')
    qualificationPage.continue()

    const educationLevelPage = Page.verifyOnPage(EducationLevelPage)
    educationLevelPage.selectEducationLevel('Reading Measure 17.0')
    educationLevelPage.reviewAndAddMoreEducationLevels()

    const checkEducationLevelPage = Page.verifyOnPage(CheckEducationLevelsPage)
    checkEducationLevelPage.educationLevelRows().should('have.length', 1)
    checkEducationLevelPage.confirmEducationLevels()

    const startDatePage = Page.verifyOnPage(StartDatePage)
    const startDatePicker = startDatePage.getDatePicker()
    const startDate = addMonths(new Date(), 1)
    startDatePicker.enterDate(startDate)
    startDatePage.continue()

    const endDateOptionPage = Page.verifyOnPage(EndDateOptionPage)
    endDateOptionPage.addEndDate('Yes')
    endDateOptionPage.continue()

    const endDatePage = Page.verifyOnPage(EndDatePage)
    const endDatePicker = endDatePage.getDatePicker()
    const endDate = addMonths(new Date(), 8)
    endDatePicker.enterDate(endDate)
    endDatePage.continue()

    const daysAndTimesPage = Page.verifyOnPage(DaysAndTimesPage)
    daysAndTimesPage.selectDayTimeCheckboxes([
      ['Monday', ['AM session']],
      ['Wednesday', ['AM session', 'PM session']],
      ['Thursday', ['AM session', 'PM session', 'ED session']],
    ])
    daysAndTimesPage.continue()

    const bankHolidayPage = Page.verifyOnPage(BankHolidayPage)
    bankHolidayPage.runOnBankHoliday('Yes')
    bankHolidayPage.continue()

    const locationPage = Page.verifyOnPage(LocationPage)
    locationPage.selectLocation('HB2 Classroom 2')
    locationPage.continue()

    const capacityPage = Page.verifyOnPage(CapacityPage)
    capacityPage.enterCapacity('6')
    capacityPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.createActivity()

    Page.verifyOnPage(ConfirmationPage)
  })
})
