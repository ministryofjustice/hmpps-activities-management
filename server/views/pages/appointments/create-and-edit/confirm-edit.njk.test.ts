import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays, format } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import {
  AppointmentJourney,
  AppointmentJourneyMode,
  AppointmentType,
} from '../../../../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../../../../routes/appointments/create-and-edit/editAppointmentJourney'
import { formatIsoDate } from '../../../../utils/datePickerUtils'

const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/confirm-edit.njk')

describe('Views - Appointments Management - Confirm Edit', () => {
  const appointmentId = 2
  const weekTomorrow = addDays(new Date(), 8)
  let compiledTemplate: Template
  let viewContext = {
    user: {},
    session: {
      appointmentJourney: {} as unknown as AppointmentJourney,
      editAppointmentJourney: {} as unknown as EditAppointmentJourney,
    },
    appointmentId,
    startDate: weekTomorrow,
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      user: {
        activeCaseLoadId: 'MDI',
      },
      session: {
        appointmentJourney: {
          mode: AppointmentJourneyMode.EDIT,
          type: AppointmentType.GROUP,
          startDate: formatIsoDate(weekTomorrow),
        },
        editAppointmentJourney: {
          numberOfAppointments: 3,
          appointments: [
            {
              sequenceNumber: 1,
              startDate: format(weekTomorrow, 'yyyy-MM-dd'),
            },
            {
              sequenceNumber: 2,
              startDate: format(addDays(weekTomorrow, 1), 'yyyy-MM-dd'),
            },
            {
              sequenceNumber: 3,
              startDate: format(addDays(weekTomorrow, 2), 'yyyy-MM-dd'),
            },
          ],
          sequenceNumber: 2,
        } as EditAppointmentJourney,
      },
      appointmentId,
      startDate: weekTomorrow,
    }
  })

  it('prisoner list is not shown when adding one prisoner', () => {
    viewContext.session.editAppointmentJourney.addPrisoners = [
      {
        number: 'A1234BC',
        name: 'TEST PRISONER',
        firstName: 'TEST',
        lastName: 'PRISONER',
        cellLocation: '1-1-1',
        status: 'ACTIVE IN',
        prisonCode: 'MDI',
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
        firstName: 'TEST',
        lastName: 'PRISONER1',
        cellLocation: '1-1-1',
        status: 'ACTIVE IN',
        prisonCode: 'MDI',
      },
      {
        number: 'B2345CD',
        name: 'TEST PRISONER2',
        firstName: 'TEST',
        lastName: 'PRISONER2',
        cellLocation: '2-2-2',
        status: 'ACTIVE IN',
        prisonCode: 'MDI',
      },
    ]

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=prisoners-list-table]').length).toEqual(1)
    expect($('[data-qa=prisoner-name-0]').text().trim()).toEqual('Prisoner1, Test')
    let prisonerDpsLink = $('[data-qa=prisoner-name-0] > div > div > a')
    expect(prisonerDpsLink.attr('href')).toEqual('https://digital-dev.prison.service.justice.gov.uk/prisoner/A1234BC')
    expect(prisonerDpsLink.attr('target')).toEqual('_blank')
    expect($('[data-qa=prisoner-number-0]').text().trim()).toEqual('A1234BC')
    expect($('[data-qa=prisoner-cell-location-0]').text().trim()).toEqual('1-1-1')

    expect($('[data-qa=prisoner-name-1]').text().trim()).toEqual('Prisoner2, Test')
    prisonerDpsLink = $('[data-qa=prisoner-name-1] > div > div > a')
    expect(prisonerDpsLink.attr('href')).toEqual('https://digital-dev.prison.service.justice.gov.uk/prisoner/B2345CD')
    expect(prisonerDpsLink.attr('target')).toEqual('_blank')
    expect($('[data-qa=prisoner-number-1]').text().trim()).toEqual('B2345CD')
    expect($('[data-qa=prisoner-cell-location-1]').text().trim()).toEqual('2-2-2')
  })
})
