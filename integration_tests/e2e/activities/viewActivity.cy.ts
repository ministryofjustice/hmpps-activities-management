import { addDays } from 'date-fns'
import Page from '../../pages/page'
import moorlandIncentiveLevels from '../../fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import getActivity from '../../fixtures/activitiesApi/getActivity.json'
import { formatIsoDate } from '../../../server/utils/datePickerUtils'
import ViewActivityPage from '../../pages/createActivity/viewActivity'

context('Edit activity', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()

    const getActivity2 = { ...getActivity }
    getActivity2.schedules[0].startDate = formatIsoDate(addDays(new Date(), 1))
    getActivity2.schedules[0].activity.paid = true
    getActivity2.schedules[0].usePrisonRegimeTime = false
    getActivity2.schedules[0].slots = [
      {
        id: 5,
        weekNumber: 1,
        startTime: '10:00',
        endTime: '11:00',
        daysOfWeek: ['Tue'],
        mondayFlag: false,
        tuesdayFlag: true,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
        timeSlot: 'AM',
      },
      {
        id: 6,
        weekNumber: 1,
        startTime: '10:00',
        endTime: '11:00',
        daysOfWeek: ['Wed'],
        mondayFlag: false,
        tuesdayFlag: false,
        wednesdayFlag: true,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
        timeSlot: 'AM',
      },
      {
        id: 6,
        weekNumber: 1,
        startTime: '13:00',
        endTime: '16:00',
        daysOfWeek: ['Wed'],
        mondayFlag: false,
        tuesdayFlag: false,
        wednesdayFlag: true,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
        timeSlot: 'PM',
      },
    ]
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
    cy.stubEndpoint('GET', '/activities/2/filtered', getActivity2 as unknown as JSON)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', inmateDetails)
    cy.stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels)
  })

  it('should follow create and then cancel future pay rate user journey', () => {
    cy.visit('/activities/view/2')

    const viewActivityPage = Page.verifyOnPage(ViewActivityPage)
    viewActivityPage.isInPrisonActivity()
  })
})
