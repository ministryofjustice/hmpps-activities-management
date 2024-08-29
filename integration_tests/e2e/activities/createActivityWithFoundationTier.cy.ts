import { addMonths } from 'date-fns'
import IndexPage from '../../pages'
import Page from '../../pages/page'
import CategoryPage from '../../pages/createActivity/category'
import ActivityNamePage from '../../pages/createActivity/name'
import RiskLevelPage from '../../pages/createActivity/riskLevel'
import QualificationPage from '../../pages/createActivity/qualification'
import getCategories from '../../fixtures/activitiesApi/getCategories.json'
import getActivities from '../../fixtures/activitiesApi/getActivities.json'
import moorlandPayBands from '../../fixtures/activitiesApi/getMdiPrisonPayBands.json'
import moorlandIncentiveLevels from '../../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
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
import PayOptionPage from '../../pages/createActivity/pay-option'
import AttendanceRequired from '../../pages/createActivity/recordAttendance'
import SessionTimesOptionPage from '../../pages/createSchedule/sessionTimesOption'

context('Create activity', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
    cy.stubEndpoint('GET', '/activity-categories', getCategories)
    cy.stubEndpoint('GET', '/prison/prison-regime/MDI', getPrisonRegime)
    cy.stubEndpoint('GET', '/prison/MDI/prison-pay-bands', moorlandPayBands)
    cy.stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=true', getActivities)
    cy.stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels)
    cy.stubEndpoint('GET', '/api/reference-domains/domains/STUDY_AREA/codes', studyAreas)
    cy.stubEndpoint('GET', '/api/agencies/MDI/eventLocations', getEventLocations)
    cy.stubEndpoint('GET', '/api/agencies/MDI/pay-profile', getPayProfile)
    cy.stubEndpoint('POST', '/activities', JSON.parse('{"schedules": [{"id": 1}]}'))
  })

  const whenWeAreCreatingAnActivityAndHaveReachedTheAttendanceRequiredScreen = () => {
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
    activityTierPage.selectActivityTier('Routine activities also called "Foundation"')
    activityTierPage.continue()

    const riskLevelPage = Page.verifyOnPage(RiskLevelPage)
    riskLevelPage.selectRiskLevel('Only people with a low workplace risk assessment are suitable')
    riskLevelPage.continue()
  }

  const whenWeProceedToTheCheckAnswersScreen = () => {
    const qualificationPage = Page.verifyOnPage(QualificationPage)
    qualificationPage.selectQualification('No')
    qualificationPage.continue()

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
    daysAndTimesPage.selectDayTimeCheckboxes([
      ['Monday', ['AM session']],
      ['Wednesday', ['AM session', 'PM session']],
      ['Thursday', ['AM session', 'PM session', 'ED session']],
    ])
    daysAndTimesPage.continue()

    const sessionTimesOptionPage = Page.verifyOnPage(SessionTimesOptionPage)
    sessionTimesOptionPage.useSessionOption("Use the prison's regime times")
    sessionTimesOptionPage.continue()

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
  }

  it('should create a foundation tier activity when we record attendance', () => {
    whenWeAreCreatingAnActivityAndHaveReachedTheAttendanceRequiredScreen()

    const attendanceRequiredPage = Page.verifyOnPage(AttendanceRequired)
    attendanceRequiredPage.selectRecordAttendance('Yes')
    attendanceRequiredPage.continue()

    const payOptionPage = Page.verifyOnPage(PayOptionPage)
    payOptionPage.selectPayOption('No')
    payOptionPage.continue()

    whenWeProceedToTheCheckAnswersScreen()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertRecordAttendance('Yes')
    checkAnswersPage.createActivity()

    Page.verifyOnPage(ConfirmationPage)
  })

  it('should create a foundation tier activity when we do not record attendance', () => {
    whenWeAreCreatingAnActivityAndHaveReachedTheAttendanceRequiredScreen()

    const attendanceRequiredPage = Page.verifyOnPage(AttendanceRequired)
    attendanceRequiredPage.selectRecordAttendance('No')
    attendanceRequiredPage.continue()

    whenWeProceedToTheCheckAnswersScreen()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertRecordAttendance('No')
    checkAnswersPage.createActivity()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.payReviewLink().should('not.exist')
  })
})
