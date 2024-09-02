import { addMonths } from 'date-fns'
import IndexPage from '../../pages'
import Page from '../../pages/page'
import CategoryPage from '../../pages/createActivity/category'
import ActivityNamePage from '../../pages/createActivity/name'
import RiskLevelPage from '../../pages/createActivity/riskLevel'
import PayRateTypePage from '../../pages/createActivity/payRateType'
import PayPage from '../../pages/createActivity/pay'
import CheckPayPage from '../../pages/createActivity/checkPay'
import QualificationPage from '../../pages/createActivity/qualification'
import EducationLevelPage from '../../pages/createActivity/educationLevel'
import CheckEducationLevelsPage from '../../pages/createActivity/checkEducationLevels'
import getCategories from '../../fixtures/activitiesApi/getCategories.json'
import getActivities from '../../fixtures/activitiesApi/getActivities.json'
import moorlandPayBands from '../../fixtures/activitiesApi/getMdiPrisonPayBands.json'
import moorlandIncentiveLevels from '../../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import educationLevels from '../../fixtures/prisonApi/educationLevels.json'
import studyAreas from '../../fixtures/prisonApi/studyAreas.json'
import CheckAnswersPage from '../../pages/createActivity/checkAnswers'
import ConfirmationPage from '../../pages/createActivity/confirmation'
import getEventLocations from '../../fixtures/prisonApi/getEventLocations.json'
import getPayProfile from '../../fixtures/prisonApi/getPayProfile.json'
import getPrisonRegime from '../../fixtures/activitiesApi/getPrisonRegime.json'
import StartDatePage from '../../pages/createSchedule/startDate'
import EndDateOptionPage from '../../pages/createSchedule/endDateOption'
import EndDatePage from '../../pages/createSchedule/endDate'
import ScheduleFrequencyPage from '../../pages/createSchedule/scheduleFrequency'
import DaysAndTimesPage from '../../pages/createSchedule/daysAndTimes'
import BankHolidayPage from '../../pages/createSchedule/bankHoliday'
import LocationPage from '../../pages/createSchedule/location'
import CapacityPage from '../../pages/createSchedule/capacity'
import ManageActivitiesDashboardPage from '../../pages/activities/manageActivitiesDashboard'
import ActivitiesIndexPage from '../../pages/activities'
import ActivityTierPage from '../../pages/createActivity/tier'
import ActivityOrganiserPage from '../../pages/createActivity/organiser'
import PayOptionPage from '../../pages/createActivity/pay-option'
import SessionTimesOptionPage from '../../pages/createSchedule/sessionTimesOption'
import SessionTimesPage from '../../pages/createSchedule/sessionTimes'

context('Create activity with custom times', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
    cy.stubEndpoint('GET', '/activity-categories', getCategories)
    cy.stubEndpoint('GET', '/prison/prison-regime/MDI', getPrisonRegime)
    cy.stubEndpoint('GET', '/prison/MDI/prison-pay-bands', moorlandPayBands)
    cy.stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=true', getActivities)
    cy.stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels)
    cy.stubEndpoint('GET', '/api/reference-domains/domains/EDU_LEVEL/codes', educationLevels)
    cy.stubEndpoint('GET', '/api/reference-domains/domains/STUDY_AREA/codes', studyAreas)
    cy.stubEndpoint('GET', '/api/agencies/MDI/eventLocations', getEventLocations)
    cy.stubEndpoint('GET', '/api/agencies/MDI/pay-profile', getPayProfile)
    cy.stubEndpoint('POST', '/activities', JSON.parse('{"schedules": [{"id": 1}]}'))
  })

  it('should click through create activity journey', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.allocateToActivitiesCard().click()

    const manageActivitiesPage = Page.verifyOnPage(ManageActivitiesDashboardPage)
    manageActivitiesPage.cardActivityCard().should('contain.text', 'Create an activity')
    manageActivitiesPage.cardActivityCard().click()

    const categoryPage = Page.verifyOnPage(CategoryPage)
    categoryPage.selectCategory('Gym, sport and fitness')
    categoryPage.continue()

    const activityNamePage = Page.verifyOnPage(ActivityNamePage)
    activityNamePage.enterName('5-a-side Football')
    activityNamePage.continue()

    const activityTierPage = Page.verifyOnPage(ActivityTierPage)
    activityTierPage.selectActivityTier('Tier 2')
    activityTierPage.continue()

    const activitOrganiserPage = Page.verifyOnPage(ActivityOrganiserPage)
    activitOrganiserPage.selectOrganiser('Prison staff')
    activitOrganiserPage.continue()

    const riskLevelPage = Page.verifyOnPage(RiskLevelPage)
    riskLevelPage.selectRiskLevel('Only people with a low workplace risk assessment are suitable')
    riskLevelPage.continue()

    const payOptionPage = Page.verifyOnPage(PayOptionPage)
    payOptionPage.selectPayOption('Yes')
    payOptionPage.continue()

    const payRateTypePage = Page.verifyOnPage(PayRateTypePage)
    payRateTypePage.incentiveLevel('Standard')
    payRateTypePage.continue()

    const payPage = Page.verifyOnPage(PayPage)
    payPage.enterPayAmount('1.00')
    payPage.selectPayBand('Low')
    payPage.futurePayRateDetails().should('exist')
    payPage.reviewAndAddMoreRates()

    const checkPayPage = Page.verifyOnPage(CheckPayPage)
    checkPayPage.payRows().should('have.length', 1)
    checkPayPage.addAnother()

    const payRateTypePage2 = Page.verifyOnPage(PayRateTypePage)
    payRateTypePage2.incentiveLevel('Enhanced')
    payRateTypePage2.continue()

    const payPage2 = Page.verifyOnPage(PayPage)
    payPage2.enterPayAmount('1.50')
    payPage2.selectPayBand('Medium')
    payPage2.reviewAndAddMoreRates()

    const checkPayPage2 = Page.verifyOnPage(CheckPayPage)
    checkPayPage2.payRows().should('have.length', 2)
    checkPayPage2.continuePayRates()

    const qualificationPage = Page.verifyOnPage(QualificationPage)
    qualificationPage.selectQualification('Yes')
    qualificationPage.continue()

    const educationLevelPage = Page.verifyOnPage(EducationLevelPage)
    educationLevelPage.selectStudyArea('English Language')
    educationLevelPage.selectEducationLevel('Reading Measure 17.0')
    educationLevelPage.continue()

    const checkEducationLevelPage = Page.verifyOnPage(CheckEducationLevelsPage)
    checkEducationLevelPage.educationLevelRows().should('have.length', 1)
    checkEducationLevelPage.getButton('Confirm').click()

    const startDatePage = Page.verifyOnPage(StartDatePage)
    const startDate = addMonths(new Date(), 1)
    startDatePage.selectDatePickerDate(startDate)
    startDatePage.continue()

    const endDateOptionPage = Page.verifyOnPage(EndDateOptionPage)
    endDateOptionPage.addEndDate('Yes')
    endDateOptionPage.continue()

    const endDatePage = Page.verifyOnPage(EndDatePage)
    const endDate = addMonths(new Date(), 8)
    endDatePage.selectDatePickerDate(endDate)
    endDatePage.continue()

    const scheduleFrequencyPage = Page.verifyOnPage(ScheduleFrequencyPage)
    scheduleFrequencyPage.selectScheduleFrequency('Weekly')
    scheduleFrequencyPage.continue()

    const daysAndTimesPage = Page.verifyOnPage(DaysAndTimesPage)
    daysAndTimesPage.selectDayTimeCheckboxes([['Monday', ['AM session']]])
    daysAndTimesPage.continue()

    const sessionTimesOptionPage = Page.verifyOnPage(SessionTimesOptionPage)
    sessionTimesOptionPage.useSessionOption('Select the start and end times')
    sessionTimesOptionPage.continue()

    const sessionTimesPage = Page.verifyOnPage(SessionTimesPage)
    sessionTimesPage.selectStartTime(10, 45, 'MONDAY', 'AM')
    sessionTimesPage.selectEndTime(11, 50, 'MONDAY', 'AM')
    sessionTimesPage.continue()

    const bankHolidayPage = Page.verifyOnPage(BankHolidayPage)
    bankHolidayPage.runOnBankHoliday('Yes')
    bankHolidayPage.continue()

    const locationPage = Page.verifyOnPage(LocationPage)
    locationPage.selectSearchForLocation()
    locationPage.selectLocation('HB2 Classroom 2')
    locationPage.continue()

    const capacityPage = Page.verifyOnPage(CapacityPage)
    capacityPage.enterCapacity('6')
    capacityPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.createActivity()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.payReviewLink().should('exist')
  })
})
