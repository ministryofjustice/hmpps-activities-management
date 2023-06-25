import { addDays } from 'date-fns'
import getRepeatGroupAppointmentDetails from '../../fixtures/activitiesApi/getRepeatGroupAppointmentDetails.json'
import getRepeatGroupOccurrence2Details from '../../fixtures/activitiesApi/getRepeatGroupOccurrence2Details.json'
import getAppointmentLocations from '../../fixtures/prisonApi/getMdiAppointmentLocations.json'
import Page from '../../pages/page'
import OccurrenceDetailsPage from '../../pages/appointments/occurrenceDetails/occurrenceDetails'
import { formatDate } from '../../../server/utils/utils'
import LocationPage from '../../pages/appointments/create-and-edit/locationPage'
import DateAndTimePage from '../../pages/appointments/create-and-edit/dateAndTimePage'
import CommentPage from '../../pages/appointments/create-and-edit/commentPage'

const tomorrow = addDays(new Date(), 1)
const nextWeek = addDays(new Date(), 7)

context('Edit appointment', () => {
  beforeEach(() => {
    getRepeatGroupOccurrence2Details.startDate = formatDate(nextWeek, 'yyyy-MM-dd')

    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
    cy.stubEndpoint('GET', '/appointment-details/10', getRepeatGroupAppointmentDetails)
    cy.stubEndpoint('GET', '/appointment-occurrence-details/12', getRepeatGroupOccurrence2Details)
    cy.stubEndpoint('GET', '/appointment-locations/MDI', getAppointmentLocations)
    cy.stubEndpoint('PATCH', '/appointment-occurrences/12')

    cy.visit('/appointments/10/occurrence/12')
  })

  context('Edit appointment occurrence', () => {
    context('Location', () => {
      it('Should update the location of appointment occurrence', () => {
        let occurrenceDetailsPage = Page.verifyOnPage(OccurrenceDetailsPage)
        occurrenceDetailsPage.getChangeLink('Location').click()

        const locationPage = Page.verifyOnPage(LocationPage)
        locationPage.assertSelectedLocation('Chapel')
        locationPage.selectLocation('Classroom')
        locationPage.getButton('Confirm and save').click()

        occurrenceDetailsPage = Page.verifyOnPage(OccurrenceDetailsPage)
        occurrenceDetailsPage.assertNotificationContents("You've changed the location for this appointment")
      })

      it('Returns to occurrence details page if back link clicked', () => {
        const occurrenceDetailsPage = Page.verifyOnPage(OccurrenceDetailsPage)
        occurrenceDetailsPage.getChangeLink('Location').click()

        const locationPage = Page.verifyOnPage(LocationPage)
        locationPage.back()
        Page.verifyOnPage(OccurrenceDetailsPage)
      })
    })

    context('Date', () => {
      it('Should update the date of appointment occurrence', () => {
        let occurrenceDetailsPage = Page.verifyOnPage(OccurrenceDetailsPage)
        occurrenceDetailsPage.getChangeLink('Date').click()

        const dateAndTimePage = Page.verifyOnPage(DateAndTimePage)
        dateAndTimePage.assertStartDate(nextWeek)
        dateAndTimePage.enterStartDate(tomorrow)
        dateAndTimePage.getButton('Confirm and save').click()

        occurrenceDetailsPage = Page.verifyOnPage(OccurrenceDetailsPage)
        occurrenceDetailsPage.assertNotificationContents("You've changed the date for this appointment")
      })
    })

    context('Start time', () => {
      it('Should update the start time of appointment occurrence', () => {
        let occurrenceDetailsPage = Page.verifyOnPage(OccurrenceDetailsPage)
        occurrenceDetailsPage = Page.verifyOnPage(OccurrenceDetailsPage)
        occurrenceDetailsPage.getChangeLink('Start time').click()

        const dateAndTimePage = Page.verifyOnPage(DateAndTimePage)
        dateAndTimePage.assertStartTime(14, 0)
        dateAndTimePage.selectStartTime(14, 30)
        dateAndTimePage.getButton('Confirm and save').click()

        occurrenceDetailsPage = Page.verifyOnPage(OccurrenceDetailsPage)
        occurrenceDetailsPage.assertNotificationContents("You've changed the time for this appointment")
      })
    })

    context('End time', () => {
      it('Should update the end time of appointment occurrence', () => {
        let occurrenceDetailsPage = Page.verifyOnPage(OccurrenceDetailsPage)
        occurrenceDetailsPage.getChangeLink('End time').click()

        const dateAndTimePage = Page.verifyOnPage(DateAndTimePage)
        dateAndTimePage.assertEndTime(15, 30)
        dateAndTimePage.selectEndTime(17, 30)
        dateAndTimePage.getButton('Confirm and save').click()

        occurrenceDetailsPage = Page.verifyOnPage(OccurrenceDetailsPage)
        occurrenceDetailsPage.assertNotificationContents("You've changed the time for this appointment")
      })
    })

    context('Date and time', () => {
      it('Should update the date, start time and end time of appointment occurrence', () => {
        let occurrenceDetailsPage = Page.verifyOnPage(OccurrenceDetailsPage)
        occurrenceDetailsPage.getChangeLink('Date').click()

        const dateAndTimePage = Page.verifyOnPage(DateAndTimePage)
        dateAndTimePage.enterStartDate(tomorrow)
        dateAndTimePage.selectStartTime(16, 0)
        dateAndTimePage.selectEndTime(17, 30)
        dateAndTimePage.getButton('Confirm and save').click()

        occurrenceDetailsPage = Page.verifyOnPage(OccurrenceDetailsPage)
        occurrenceDetailsPage.assertNotificationContents("You've changed the date and time for this appointment")
      })

      it('Returns to occurrence details page if back link clicked', () => {
        const occurrenceDetailsPage = Page.verifyOnPage(OccurrenceDetailsPage)
        occurrenceDetailsPage.getChangeLink('Date').click()

        const dateAndTimePage = Page.verifyOnPage(DateAndTimePage)
        dateAndTimePage.back()
        Page.verifyOnPage(OccurrenceDetailsPage)
      })
    })

    context('Comment', () => {
      it('Should update the comment of appointment occurrence', () => {
        let occurrenceDetailsPage = Page.verifyOnPage(OccurrenceDetailsPage)
        occurrenceDetailsPage.getChangeLink('Extra information').click()

        const commentPage = Page.verifyOnPage(CommentPage)
        commentPage.enterComment('Updated appointment level comment')
        commentPage.getButton('Confirm and save').click()

        occurrenceDetailsPage = Page.verifyOnPage(OccurrenceDetailsPage)
        occurrenceDetailsPage.assertNotificationContents("You've changed the extra information for this appointment")
      })

      it('Returns to occurrence details page if back link clicked', () => {
        const occurrenceDetailsPage = Page.verifyOnPage(OccurrenceDetailsPage)
        occurrenceDetailsPage.getChangeLink('Extra information').click()

        const commentPage = Page.verifyOnPage(CommentPage)
        commentPage.back()
        Page.verifyOnPage(OccurrenceDetailsPage)
      })
    })
  })
})
