import { addDays } from 'date-fns'
import Page from '../../pages/page'
import PayRateTypePage from '../../pages/createActivity/payRateType'
import PayPage from '../../pages/createActivity/pay'
import CheckPayPage from '../../pages/createActivity/checkPay'
import moorlandPayBands from '../../fixtures/activitiesApi/getMdiPrisonPayBands.json'
import moorlandIncentiveLevels from '../../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import getPayProfile from '../../fixtures/prisonApi/getPayProfile.json'
import getActivity from '../../fixtures/activitiesApi/getActivity.json'
import getAllocations from '../../fixtures/activitiesApi/getAllocations.json'
import prisonerAllocations from '../../fixtures/activitiesApi/prisonerAllocations.json'
import getCandidates from '../../fixtures/activitiesApi/getCandidates.json'

import { formatIsoDate } from '../../../server/utils/datePickerUtils'
import ViewActivityPage from '../../pages/createActivity/viewActivity'
import PayAmountPage from '../../pages/createActivity/pay-amount'
import PayDateOptionPage from '../../pages/createActivity/pay-date-option'
import CancelPayRatePage from '../../pages/createActivity/cancel-pay-rate'

context('Edit activity', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
    cy.stubEndpoint('GET', '/prison/MDI/prison-pay-bands', moorlandPayBands)
    cy.stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels)
    cy.stubEndpoint('GET', '/api/agencies/MDI/pay-profile', getPayProfile)
    cy.stubEndpoint('GET', '/schedules/2/allocations\\?activeOnly=true&includePrisonerSummary=true', getAllocations)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations)
    cy.stubEndpoint('GET', '/schedules/2/waiting-list-applications', JSON.parse('[]'))
    cy.stubEndpoint('GET', '/schedules/2/candidates(.)*', getCandidates)
    cy.stubEndpoint('POST', '/schedules/2/allocations')

    const getActivity2 = { ...getActivity }
    getActivity2.schedules[0].startDate = formatIsoDate(addDays(new Date(), 1))
    getActivity2.schedules[0].activity.paid = true
    const inmateDetails = [
      {
        prisonerNumber: 'A9477DY',
        firstName: 'JOHN',
        lastName: 'JONES',
      },
      {
        prisonerNumber: 'G4793VF',
        firstName: 'JACK',
        lastName: 'SMITH',
      },
    ]
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', inmateDetails)
    cy.stubEndpoint('GET', '/activities/2/filtered', getActivity2)
    cy.stubEndpoint('PATCH', '/activities/MDI/activityId/2', getActivity2)
  })

  it('should follow create and then cancel future pay rate user journey', () => {
    const twentyNineDaysAhead = addDays(new Date(), 29)
    cy.visit('/activities/view/2')

    const viewActivityPage = Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.changePayLink().click()

    const checkPayPage = Page.verifyOnPage(CheckPayPage)
    checkPayPage.addNewPayRate()

    const payRateTypePage2 = Page.verifyOnPage(PayRateTypePage)
    payRateTypePage2.incentiveLevel('Enhanced')
    payRateTypePage2.continue()

    const payPage = Page.verifyOnPage(PayPage)
    payPage.enterPayAmount('1.00')
    payPage.selectPayBand('High')
    payPage.futurePayRateDetails().should('not.exist')
    payPage.radios().should('not.exist')
    payPage.saveAndContinue()

    Page.verifyOnPage(CheckPayPage)
    checkPayPage.changePay()

    const payAmountPage = Page.verifyOnPage(PayAmountPage)
    payAmountPage.enterPayAmount('{backspace}{backspace}{backspace}{backspace}1.35')
    payAmountPage.continue()

    const payDateOptionPage = Page.verifyOnPage(PayDateOptionPage)
    payDateOptionPage.dateOptionOther()
    payDateOptionPage.selectDatePickerDate(twentyNineDaysAhead)
    payDateOptionPage.confirm()

    Page.verifyOnPage(CheckPayPage)
    checkPayPage.cancelPay()

    const cancelPayRatePage = Page.verifyOnPage(CancelPayRatePage)
    cancelPayRatePage.cancelPayRate()
    cancelPayRatePage.confirm()
  })
})
