import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import {
  AppointmentJourney,
  AppointmentJourneyMode,
  AppointmentType,
} from '../../../../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../../../../routes/appointments/create-and-edit/editAppointmentJourney'

const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/confirm-edit.njk')

describe('Views - Appointments Management - Confirm Edit', () => {
  const appointmentId = 1
  const occurrenceId = 2
  const weekTomorrow = addDays(new Date(), 8)
  let compiledTemplate: Template
  let viewContext = {
    session: {
      appointmentJourney: {} as unknown as AppointmentJourney,
      editAppointmentJourney: {} as unknown as EditAppointmentJourney,
    },
    appointmentId,
    occurrenceId,
    startDate: weekTomorrow,
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      session: {
        appointmentJourney: {
          mode: AppointmentJourneyMode.EDIT,
          type: AppointmentType.GROUP,
          startDate: {
            day: weekTomorrow.getDate(),
            month: weekTomorrow.getMonth() + 1,
            year: weekTomorrow.getFullYear(),
            date: weekTomorrow,
          },
        },
        editAppointmentJourney: {
          repeatCount: 3,
          sequenceNumbers: [1, 2, 3],
          sequenceNumber: 2,
        } as EditAppointmentJourney,
      },
      appointmentId,
      occurrenceId,
      startDate: weekTomorrow,
    }
  })

  it('back link href contains review prisoners when redirected from add prisoners page', () => {
    viewContext.session.editAppointmentJourney.addPrisoners = [
      {
        number: 'A1234BC',
        name: 'TEST PRISONER',
        cellLocation: '1-1-1',
      },
    ]

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('a.govuk-back-link').attr('href')).toEqual('review-prisoners')
  })

  it('back link href does not contain review prisoners when redirected from cancel or remove prisoner', () => {
    viewContext.session.editAppointmentJourney.addPrisoners = null

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('a.govuk-back-link').attr('href')).toEqual('/appointments/1/occurrence/2')
  })

  it('prisoner list is not shown when adding one prisoner', () => {
    viewContext.session.editAppointmentJourney.addPrisoners = [
      {
        number: 'A1234BC',
        name: 'TEST PRISONER',
        cellLocation: '1-1-1',
      },
    ]

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=prisoners-list-table]').length).toEqual(0)
  })

  it('prisoner list is shown when adding two prisoners', () => {
    viewContext.session.editAppointmentJourney.addPrisoners = [
      {
        number: 'A1234BC',
        name: 'TEST PRISONER1',
        cellLocation: '1-1-1',
      },
      {
        number: 'B2345CD',
        name: 'TEST PRISONER2',
        cellLocation: '2-2-2',
      },
    ]

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=prisoners-list-table]').length).toEqual(1)
    expect($('[data-qa=prisoner-name-0]').text().trim()).toEqual('Prisoner1, Test')
    let prisonerDpsLink = $('[data-qa=prisoner-name-0] > a')
    expect(prisonerDpsLink.attr('href')).toEqual('https://digital-dev.prison.service.justice.gov.uk/prisoner/A1234BC')
    expect(prisonerDpsLink.attr('target')).toEqual('_blank')
    expect($('[data-qa=prisoner-number-0]').text().trim()).toEqual('A1234BC')
    expect($('[data-qa=prisoner-cell-location-0]').text().trim()).toEqual('1-1-1')

    expect($('[data-qa=prisoner-name-1]').text().trim()).toEqual('Prisoner2, Test')
    prisonerDpsLink = $('[data-qa=prisoner-name-1] > a')
    expect(prisonerDpsLink.attr('href')).toEqual('https://digital-dev.prison.service.justice.gov.uk/prisoner/B2345CD')
    expect(prisonerDpsLink.attr('target')).toEqual('_blank')
    expect($('[data-qa=prisoner-number-1]').text().trim()).toEqual('B2345CD')
    expect($('[data-qa=prisoner-cell-location-1]').text().trim()).toEqual('2-2-2')
  })
})
