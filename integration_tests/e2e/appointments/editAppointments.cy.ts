import { addDays } from 'date-fns'
import getRepeatGroupAppointmentSeriesDetails from '../../fixtures/activitiesApi/getRepeatGroupAppointmentSeriesDetails.json'
import getRepeatGroupAppointment2Details from '../../fixtures/activitiesApi/getRepeatGroupAppointment2Details.json'
import getAppointmentLocations from '../../fixtures/prisonApi/getMdiAppointmentLocations.json'
import getScheduledEvents from '../../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import Page from '../../pages/page'
import AppointmentDetailsPage from '../../pages/appointments/appointment/appointmentDetailsPage'
import { formatDate } from '../../../server/utils/utils'
import LocationPage from '../../pages/appointments/create-and-edit/locationPage'
import DateAndTimePage from '../../pages/appointments/create-and-edit/dateAndTimePage'
import ExtraInformationPage from '../../pages/appointments/create-and-edit/extraInformationPage'
import SchedulePage from '../../pages/appointments/create-and-edit/schedulePage'

const tomorrow = addDays(new Date(), 1)
const nextWeek = addDays(new Date(), 7)

context('Edit appointment', () => {
  beforeEach(() => {
    getRepeatGroupAppointment2Details.startDate = formatDate(nextWeek, 'yyyy-MM-dd')
    getRepeatGroupAppointmentSeriesDetails.appointments[0].startDate = formatDate(nextWeek, 'yyyy-MM-dd')

    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
    cy.stubEndpoint('GET', '/appointment-series/10/details', getRepeatGroupAppointmentSeriesDetails)
    cy.stubEndpoint('GET', '/appointments/12/details', getRepeatGroupAppointment2Details)
    cy.stubEndpoint('GET', '/appointment-locations/MDI', getAppointmentLocations)
    cy.stubEndpoint(
      'POST',
      `/scheduled-events/prison/MDI\\?date=${formatDate(tomorrow, 'yyyy-MM-dd')}`,
      getScheduledEvents,
    )
    cy.stubEndpoint(
      'POST',
      `/scheduled-events/prison/MDI\\?date=${formatDate(nextWeek, 'yyyy-MM-dd')}`,
      getScheduledEvents,
    )
    cy.stubEndpoint('PATCH', '/appointments/12')
    cy.stubEndpoint('GET', '/users/jsmith', JSON.parse('{"name": "John Smith", "username": "jsmith"}'))

    cy.visit('/appointments/12')
  })

  context('Edit appointment', () => {
    context('Location', () => {
      it('Should update the location of appointment', () => {
        let appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
        appointmentDetailsPage.getChangeLink('Location').click()

        const locationPage = Page.verifyOnPage(LocationPage)
        locationPage.assertSelectedLocation('Chapel')
        locationPage.selectLocation('Classroom')
        locationPage.getButton('Update location').click()

        appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
        appointmentDetailsPage.assertNotificationContents("You've changed the location for this appointment")
      })

      it('Returns to appointment details page if back link clicked', () => {
        const appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
        appointmentDetailsPage.getChangeLink('Location').click()

        const locationPage = Page.verifyOnPage(LocationPage)
        locationPage.back()
        Page.verifyOnPage(AppointmentDetailsPage)
      })
    })

    context('Date', () => {
      it('Should update the date of appointment', () => {
        let appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
        appointmentDetailsPage.getChangeLink('Date').click()

        const dateAndTimePage = Page.verifyOnPage(DateAndTimePage)
        dateAndTimePage.assertStartDate(nextWeek)
        dateAndTimePage.enterStartDate(tomorrow)
        dateAndTimePage.continue()

        const schedulePage = Page.verifyOnPage(SchedulePage)
        schedulePage.getButton('Update date').click()

        appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
        appointmentDetailsPage.assertNotificationContents("You've changed the date for this appointment")
      })
    })

    context('Start time', () => {
      it('Should update the start time of appointment', () => {
        let appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
        appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
        appointmentDetailsPage.getChangeLink('Start time').click()

        const dateAndTimePage = Page.verifyOnPage(DateAndTimePage)
        dateAndTimePage.assertStartTime(14, 0)
        dateAndTimePage.selectStartTime(14, 30)
        dateAndTimePage.continue()

        const schedulePage = Page.verifyOnPage(SchedulePage)
        schedulePage.getButton('Update time').click()

        appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
        appointmentDetailsPage.assertNotificationContents("You've changed the time for this appointment")
      })
    })

    context('End time', () => {
      it('Should update the end time of appointment', () => {
        let appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
        appointmentDetailsPage.getChangeLink('End time').click()

        const dateAndTimePage = Page.verifyOnPage(DateAndTimePage)
        dateAndTimePage.assertEndTime(15, 30)
        dateAndTimePage.selectEndTime(17, 30)
        dateAndTimePage.continue()

        const schedulePage = Page.verifyOnPage(SchedulePage)
        schedulePage.getButton('Update time').click()

        appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
        appointmentDetailsPage.assertNotificationContents("You've changed the time for this appointment")
      })
    })

    context('Date and time', () => {
      it('Should update the date, start time and end time of appointment', () => {
        let appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
        appointmentDetailsPage.getChangeLink('Date').click()

        const dateAndTimePage = Page.verifyOnPage(DateAndTimePage)
        dateAndTimePage.enterStartDate(tomorrow)
        dateAndTimePage.selectStartTime(16, 0)
        dateAndTimePage.selectEndTime(17, 30)
        dateAndTimePage.continue()

        const schedulePage = Page.verifyOnPage(SchedulePage)
        schedulePage.getButton('Update date and time').click()

        appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
        appointmentDetailsPage.assertNotificationContents("You've changed the date and time for this appointment")
      })

      it('Returns to appointment details page if back link clicked', () => {
        const appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
        appointmentDetailsPage.getChangeLink('Date').click()

        const dateAndTimePage = Page.verifyOnPage(DateAndTimePage)
        dateAndTimePage.back()
        Page.verifyOnPage(AppointmentDetailsPage)
      })
    })

    context('Extra information', () => {
      it('Should update the extra information of appointment', () => {
        let appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
        appointmentDetailsPage.getChangeLink('Extra information').click()

        const extraInformationPage = Page.verifyOnPage(ExtraInformationPage)
        extraInformationPage.enterExtraInformation('Updated appointment extra information')
        extraInformationPage.getButton('Update extra information').click()

        appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
        appointmentDetailsPage.assertNotificationContents("You've changed the extra information for this appointment")
      })

      it('Returns to appointment details page if back link clicked', () => {
        const appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
        appointmentDetailsPage.getChangeLink('Extra information').click()

        const extraInformationPage = Page.verifyOnPage(ExtraInformationPage)
        extraInformationPage.back()
        Page.verifyOnPage(AppointmentDetailsPage)
      })
    })
  })
})
