import { addDays } from 'date-fns'
import getRepeatGroupAppointmentSeriesDetails from '../../fixtures/activitiesApi/getRepeatGroupAppointmentSeriesDetails.json'
import getRepeatGroupAppointment2Details from '../../fixtures/activitiesApi/getRepeatGroupAppointment2Details.json'
import getAppointmentLocations from '../../fixtures/prisonApi/getMdiAppointmentLocations.json'
import getScheduledEvents from '../../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import getPrisonPrisonersG0995GW from '../../fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-G0995GW.json'
import getPrisonPrisonersG6123VU from '../../fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-G6123VU.json'
import getPrisonerG0995GW from '../../fixtures/prisonerSearchApi/getPrisoner-MDI-G0995GW.json'
import getPrisonerG6123VU from '../../fixtures/prisonerSearchApi/getPrisoner-MDI-G6123VU.json'
import getPrisonerAlertsG0995GW from '../../fixtures/alertsApi/getPrisonerAlertsG0995GW.json'
import getPrisonerAlertsG0995GWG6123VU from '../../fixtures/alertsApi/getPrisonerAlertsG0995GWG6123VU.json'
import getNonAssociationsBetweenG0995GWA1350DZ from '../../fixtures/nonAssociationsApi/getNonAssociationsBetweenG0995GWA1350DZ.json'
import getNonAssociationsBetweenG0995GWG6123VU from '../../fixtures/nonAssociationsApi/getNonAssociationsBetweenG0995GWG6123VU.json'
import getPrisonPrisonersG0995GWA1351DZ from '../../fixtures/prisonerSearchApi/postPrisonerNumbers-A1350DZ-G0995GW.json'
import getPrisonPrisonersG0995GWG6123VU from '../../fixtures/prisonerSearchApi/postPrisonerNumbers-G6123VU-G0995GW.json'

import Page from '../../pages/page'
import AppointmentDetailsPage from '../../pages/appointments/appointment/appointmentDetailsPage'
import { formatDate } from '../../../server/utils/utils'
import LocationPage from '../../pages/appointments/create-and-edit/locationPage'
import DateAndTimePage from '../../pages/appointments/create-and-edit/dateAndTimePage'
import ExtraInformationPage from '../../pages/appointments/create-and-edit/extraInformationPage'
import SchedulePage from '../../pages/appointments/create-and-edit/schedulePage'
import HowToAddPrisonersPage from '../../pages/appointments/create-and-edit/howToAddPrisonersPage'
import SelectPrisonerPage from '../../pages/appointments/create-and-edit/selectPrisonerPage'
import ReviewPrisonersPage from '../../pages/appointments/create-and-edit/reviewPrisonersPage'
import ReviewPrisonerAlertsPage from '../../pages/appointments/create-and-edit/reviewPrisonerAlertsPage'
import ReviewNonAssociationsEditPage from '../../pages/appointments/create-and-edit/reviewNonAssociationsEditPage'

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
    cy.stubEndpoint(
      'GET',
      '/users/jsmith',
      JSON.parse('{"name": "John Smith", "username": "jsmith", "authSource": "nomis"}'),
    )
    cy.stubEndpoint('GET', '/prison/MDI/prisoners\\?term=potta&size=50', getPrisonPrisonersG0995GW)
    cy.stubEndpoint('GET', '/prison/MDI/prisoners\\?term=saunders&size=50', getPrisonPrisonersG6123VU)
    cy.stubEndpoint('GET', '/prisoner/G0995GW', getPrisonerG0995GW)
    cy.stubEndpoint('GET', '/prisoner/G6123VU', getPrisonerG6123VU)
    cy.stubEndpoint('POST', '/search/alerts/prison-numbers', getPrisonerAlertsG0995GW)
    cy.stubEndpoint('POST', '/search/alerts/prison-numbers', getPrisonerAlertsG0995GWG6123VU)
    cy.stubEndpoint('POST', '/non-associations/between', getNonAssociationsBetweenG0995GWA1350DZ)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getPrisonPrisonersG0995GWA1351DZ)

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
  context('Add prisoners', () => {
    it('Add a prisoner without a non-association', () => {
      cy.stubEndpoint('POST', '/non-associations/between', [])
      const appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
      appointmentDetailsPage.addPrisonersLink().click()

      const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
      howToAddPrisonersPage.selectOneByOne()
      howToAddPrisonersPage.continue()

      const selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
      selectPrisonerPage.enterPrisonerNumber('potta')
      selectPrisonerPage.searchButton().click()

      selectPrisonerPage.continueButton().click()
      const reviewPrisonersPage = Page.verifyOnPage(ReviewPrisonersPage)
      reviewPrisonersPage.assertPrisonerInList('Potta, Aeticake')
      reviewPrisonersPage.continue()

      const reviewPrisonerAlertsPage = Page.verifyOnPage(ReviewPrisonerAlertsPage)
      reviewPrisonerAlertsPage.continue()

      Page.verifyOnPage(SchedulePage)
    })
    it('Add a single prisoner with a non-association with an existing prisoner', () => {
      const appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
      appointmentDetailsPage.addPrisonersLink().click()

      const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
      howToAddPrisonersPage.selectOneByOne()
      howToAddPrisonersPage.continue()

      const selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
      selectPrisonerPage.enterPrisonerNumber('potta')
      selectPrisonerPage.searchButton().click()

      selectPrisonerPage.continueButton().click()
      const reviewPrisonersPage = Page.verifyOnPage(ReviewPrisonersPage)
      reviewPrisonersPage.assertPrisonerInList('Potta, Aeticake')
      reviewPrisonersPage.continue()

      const reviewPrisonerAlertsPage = Page.verifyOnPage(ReviewPrisonerAlertsPage)
      reviewPrisonerAlertsPage.continue()

      const reviewNonAssociationsPage = Page.verifyOnPage(ReviewNonAssociationsEditPage)
      reviewNonAssociationsPage.cards(1)
      reviewNonAssociationsPage.getCard('G0995GW').then($data => {
        expect($data.get(0).innerText).to.contain('David Winchurch')
        expect($data.get(0).innerText).to.contain('Already attending')
        expect($data.get(1).innerText).to.contain('A1350DZ')
        expect($data.get(2).innerText).to.contain('2-2-024')
        expect($data.get(3).innerText).to.contain('30 October 2024')
      })

      reviewNonAssociationsPage.removeAttendeeLink('G0995GW').click()
      reviewNonAssociationsPage.header().should('contain.text', 'There are no attendees to add')
      reviewNonAssociationsPage.addPrisonerButton().should('exist')
    })
    it('Add two prisoners who have non-associations with each other', () => {
      cy.stubEndpoint('POST', '/non-associations/between', getNonAssociationsBetweenG0995GWG6123VU)
      cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getPrisonPrisonersG0995GWG6123VU)

      const appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
      appointmentDetailsPage.addPrisonersLink().click()

      const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
      howToAddPrisonersPage.selectOneByOne()
      howToAddPrisonersPage.continue()

      const selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
      selectPrisonerPage.enterPrisonerNumber('potta')
      selectPrisonerPage.searchButton().click()

      selectPrisonerPage.continueButton().click()
      const reviewPrisonersPage = Page.verifyOnPage(ReviewPrisonersPage)
      reviewPrisonersPage.assertPrisonerInList('Potta, Aeticake')
      reviewPrisonersPage.addAnotherPrisoner()

      selectPrisonerPage.enterPrisonerNumber('saunders')
      selectPrisonerPage.searchButton().click()
      selectPrisonerPage.continueButton().click()

      Page.verifyOnPage(ReviewPrisonersPage)
      reviewPrisonersPage.continue()

      const reviewPrisonerAlertsPage = Page.verifyOnPage(ReviewPrisonerAlertsPage)
      reviewPrisonerAlertsPage.continue()

      const reviewNonAssociationsPage = Page.verifyOnPage(ReviewNonAssociationsEditPage)
      reviewNonAssociationsPage.cards(2)
      reviewNonAssociationsPage.getCard('G0995GW').then($data => {
        expect($data.get(0).innerText).to.contain('John Saunders')
        expect($data.get(0).innerText).to.not.contain('Already attending')
        expect($data.get(1).innerText).to.contain('G6123VU')
        expect($data.get(2).innerText).to.contain('2-2-024')
        expect($data.get(3).innerText).to.contain('30 October 2024')
      })
      reviewNonAssociationsPage.getCard('G6123VU').then($data => {
        expect($data.get(0).innerText).to.contain('Aeticake Potta')
        expect($data.get(0).innerText).to.not.contain('Already attending')
        expect($data.get(1).innerText).to.contain('G0995GW')
        expect($data.get(2).innerText).to.contain('1-3')
        expect($data.get(3).innerText).to.contain('30 October 2024')
      })
    })
  })
})
