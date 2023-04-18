import { addDays } from 'date-fns'
import getRepeatGroupAppointmentDetails from '../../fixtures/activitiesApi/getRepeatGroupAppointmentDetails.json'
import getGroupOccurrenceDetails from '../../fixtures/activitiesApi/getGroupOccurrenceDetails.json'
import getAppointmentLocations from '../../fixtures/prisonApi/getMdiAppointmentLocations.json'
import Page from '../../pages/page'
import OccurrenceDetailsPage from '../../pages/appointments/occurrenceDetails/occurrenceDetails'
import { formatDate } from '../../../server/utils/utils'
import LocationPage from '../../pages/appointments/create-and-edit/locationPage'

context('Edit appointment', () => {
  beforeEach(() => {
    const nextWeek = addDays(new Date(), 7)
    getGroupOccurrenceDetails.startDate = formatDate(nextWeek, 'yyyy-MM-dd')

    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')
    cy.signIn()
    cy.stubEndpoint('GET', '/appointment-details/10', getRepeatGroupAppointmentDetails)
    cy.stubEndpoint('GET', '/appointment-occurrence-details/12', getGroupOccurrenceDetails)
    cy.stubEndpoint('GET', '/api/agencies/MDI/locations\\?eventType=APP', getAppointmentLocations)
    cy.stubEndpoint('PATCH', '/appointment-occurrences/12')

    cy.visit('/appointments/10/occurrence/12')
  })

  context('Edit appointment occurrence', () => {
    it('Should update the location of appointment occurrence', () => {
      let occurrenceDetailsPage = Page.verifyOnPage(OccurrenceDetailsPage)
      occurrenceDetailsPage.getChangeLink('Location').click()

      let locationPage = Page.verifyOnPage(LocationPage)
      locationPage.assertSelectedLocation('Chapel')
      locationPage.selectLocation('Classroom')
      locationPage.getButton('Accept and save').click()

      occurrenceDetailsPage = Page.verifyOnPage(OccurrenceDetailsPage)
      occurrenceDetailsPage.assertNotificationContents('Appointment location for this occurrence changed successfully')
      occurrenceDetailsPage.getChangeLink('Location').click()

      locationPage = Page.verifyOnPage(LocationPage)
      locationPage.back()
      Page.verifyOnPage(OccurrenceDetailsPage)
    })
  })
})
