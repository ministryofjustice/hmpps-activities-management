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
import AllocationDashboard from '../../pages/allocateToActivity/allocationDashboard'
import ViewActivityPage from '../../pages/createActivity/viewActivity'

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
  })

  it('should show the correct elements when adding a pay rate on an existing activity', () => {
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

    cy.visit('/activities/allocation-dashboard/2')
    const allocation = Page.verifyOnPage(AllocationDashboard)
    allocation.getLinkByText('adding or removing corresponding pay rates.').invoke('attr', 'target', '_self').click()

    const viewActivityPage = Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.changePayLink().click()

    const checkPayPage = Page.verifyOnPage(CheckPayPage)
    checkPayPage.addNewPayRate()

    const payRateTypePage2 = Page.verifyOnPage(PayRateTypePage)
    payRateTypePage2.incentiveLevel('Enhanced')
    payRateTypePage2.continue()

    const payPage = Page.verifyOnPage(PayPage)
    payPage.enterPayAmount('1.00')
    payPage.selectPayBand('Low')
    payPage.radios().should('not.exist')
  })
})
