import { format, subDays } from 'date-fns'
import IndexPage from '../../pages'
import Page from '../../pages/page'
import ActivitiesIndexPage from '../../pages/activities'
import ManageActivitiesDashboardPage from '../../pages/activities/manageActivitiesDashboard'
import ChangesInCircumstancesDatePage from '../../pages/activities/changesInCircumstancesDate'
import ChangesInCircumstancesResultsPage from '../../pages/activities/changesInCircumstancesResults'
import getChangeEvents from '../../fixtures/activitiesApi/getChangeEvents.json'

const inmateDetails = [
  {
    prisonerNumber: 'A1234AA',
    cellLocation: '1-12-123',
    firstName: 'Bob',
    lastName: 'Bobson',
  },
  {
    prisonerNumber: 'A1234AB',
    cellLocation: '1-12-123',
    firstName: 'Terry',
    lastName: 'Glasvern',
  },
  {
    prisonerNumber: 'A1234AC',
    cellLocation: '1-12-123',
    firstName: 'John',
    lastName: 'Armitage',
  },
]

context('Changes in circumstances', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', inmateDetails)
  })

  it('Shows correct message if there is no data', () => {
    const date = format(new Date(), 'yyyy-MM-dd')

    cy.stubEndpoint('GET', `/event-review/prison/MDI\\?date=${date}&page=0&size=10`, {
      content: [],
      totalElements: 0,
      totalPages: 0,
      pageNumber: 0,
    } as unknown as JSON)

    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.allocateToActivitiesCard().click()

    const manageActivitiesPage = Page.verifyOnPage(ManageActivitiesDashboardPage)
    manageActivitiesPage.changesInCircumstancesCard().click()

    const changesInCircumstancesDatePage = Page.verifyOnPage(ChangesInCircumstancesDatePage)
    changesInCircumstancesDatePage.datePresetOption().should('exist')
    changesInCircumstancesDatePage.radioTodayClick()
    changesInCircumstancesDatePage.submit()

    const changesInCircumstancesResultsPage = Page.verifyOnPage(ChangesInCircumstancesResultsPage)
    changesInCircumstancesResultsPage
      .noDataParagraph()
      .should('contain.text', 'There are no changes to show for today.')
    changesInCircumstancesResultsPage.noDataLink().should('exist')
    changesInCircumstancesResultsPage.noDataLink().click()
    cy.location().should(loc => {
      expect(loc.pathname).to.eq('/activities/change-of-circumstances/select-period')
    })

    const yesterdayDate = format(subDays(new Date(), 1), 'yyyy-MM-dd')

    cy.stubEndpoint('GET', `/event-review/prison/MDI\\?date=${yesterdayDate}&page=0&size=10`, {
      content: [],
      totalElements: 0,
      totalPages: 0,
      pageNumber: 0,
    } as unknown as JSON)

    changesInCircumstancesDatePage.radioYesterdayClick()
    changesInCircumstancesDatePage.submit()
    changesInCircumstancesResultsPage
      .noDataParagraph()
      .should('contain.text', 'There are no changes to show for yesterday.')
    changesInCircumstancesResultsPage.noDataLink().should('exist')
  })

  it('Shows correct message if there is no data - chosen day', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.allocateToActivitiesCard().click()

    const manageActivitiesPage = Page.verifyOnPage(ManageActivitiesDashboardPage)
    manageActivitiesPage.changesInCircumstancesCard().click()

    const chosenDate = new Date('2024-09-22')
    const chosenDateFormatted = format(chosenDate, 'yyyy-MM-dd')

    cy.stubEndpoint('GET', `/event-review/prison/MDI\\?date=${chosenDateFormatted}&page=0&size=10`, {
      content: [],
      totalElements: 0,
      totalPages: 0,
      pageNumber: 0,
    } as unknown as JSON)

    const changesInCircumstancesDatePage = Page.verifyOnPage(ChangesInCircumstancesDatePage)
    changesInCircumstancesDatePage.radioOtherClick()
    changesInCircumstancesDatePage.selectDatePickerDate(chosenDate)
    changesInCircumstancesDatePage.submit()

    const changesInCircumstancesResultsPage = Page.verifyOnPage(ChangesInCircumstancesResultsPage)
    changesInCircumstancesResultsPage
      .noDataParagraph()
      .should('contain.text', 'There are no changes to show for 22 September 2024.')
    changesInCircumstancesResultsPage.noDataLink().should('exist')
  })

  it('Shows data if present', () => {
    cy.stubEndpoint('GET', `/event-review/prison/MDI\\?date=2023-05-16&page=0&size=10`, getChangeEvents)

    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.allocateToActivitiesCard().click()

    const manageActivitiesPage = Page.verifyOnPage(ManageActivitiesDashboardPage)
    manageActivitiesPage.changesInCircumstancesCard().click()

    const changesInCircumstancesDatePage = Page.verifyOnPage(ChangesInCircumstancesDatePage)
    changesInCircumstancesDatePage.radioOtherClick()
    changesInCircumstancesDatePage.selectDatePickerDate(new Date('2023-05-16'))
    changesInCircumstancesDatePage.submit()

    const changesInCircumstancesResultsPage = Page.verifyOnPage(ChangesInCircumstancesResultsPage)
    changesInCircumstancesResultsPage.noDataParagraph().should('not.exist')
    changesInCircumstancesResultsPage.noDataLink().should('not.exist')
    changesInCircumstancesResultsPage.assertRow(
      0,
      true,
      'Bobson, Bob',
      'Out of prison',
      '16 May 2023 12:17 PM',
      'Non-association',
    )
    changesInCircumstancesResultsPage.assertRow(
      1,
      true,
      'Glasvern, Terry',
      'Out of prison',
      '16 May 2023 02:00 PM',
      'Cell-move',
    )
    changesInCircumstancesResultsPage.assertRow(
      2,
      true,
      'Armitage, John',
      'Out of prison',
      '16 May 2023 03:20 PM',
      'Cell-move',
    )
  })
})
