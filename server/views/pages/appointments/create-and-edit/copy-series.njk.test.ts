import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'

import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import {
  AppointmentJourney,
  AppointmentJourneyMode,
  AppointmentType,
} from '../../../../routes/appointments/create-and-edit/appointmentJourney'
import { HowToCopySeriesOptions } from '../../../../routes/appointments/create-and-edit/handlers/copySeries'

const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/copy-series.njk')

describe('Views - Appointments Management - Copy appointment series', () => {
  let compiledTemplate: Template

  const appointmentJourney = {
    mode: AppointmentJourneyMode.COPY,
    type: AppointmentType.GROUP,
    appointmentName: 'Chaplaincy',
    numberOfAppointments: 4,
    originalAppointmentId: 11,
  } as AppointmentJourney

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  const render = (formResponses = {}) =>
    cheerio.load(
      compiledTemplate.render({
        appointmentJourney,
        HowToCopySeriesOptions,
        formResponses,
        csrfToken: 'csrf',
      }),
    )

  it('should explain that the appointment is part of a series', () => {
    const $ = render()

    expect($('h1').text().trim()).toBe("Copying an appointment that's part of a series")

    expect($('.govuk-body-l').text().trim()).toBe('Chaplaincy is part of a series of 4 appointments.')

    expect($('.govuk-fieldset__legend').text().replace(/\s+/g, ' ').trim()).toBe(
      'Select what you want to create by copying this appointment',
    )
  })

  it('should offer one-off and series copy options', () => {
    const $ = render()

    expect(
      $('input[name="howToCopy"]')
        .map((_, element) => $(element).val())
        .get(),
    ).toEqual(['ONE_OFF', 'SERIES'])

    expect($('label[for="howToCopy"]').text().trim()).toBe('A one-off appointment')
    expect($('label[for="howToCopy-2"]').text().trim()).toBe('A series of repeating appointments')
  })

  it.each([HowToCopySeriesOptions.ONE_OFF, HowToCopySeriesOptions.SERIES])(
    'should retain the selected option %s',
    howToCopy => {
      const $ = render({ howToCopy })

      const checked = $('input[name="howToCopy"]:checked')

      expect(checked).toHaveLength(1)
      expect(checked.val()).toBe(howToCopy)
    },
  )

  it('should allow the user to continue or cancel and return to the original appointment', () => {
    const $ = render()

    expect($('form').attr('action')).toBe('copy-series')
    expect($('button[type="submit"]').text().trim()).toBe('Continue')

    const cancelLink = $('a').filter((_, element) => $(element).text().includes('Cancel and return to appointment'))

    expect(cancelLink.attr('href')).toBe('/appointments/11')
  })
})
