import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { addDays } from 'date-fns'

import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentDetails } from '../../../../@types/activitiesAPI/types'
import { formatDate } from '../../../../utils/utils'

const view = fs.readFileSync('server/views/pages/appointments/appointment/copy.njk')

describe('Views - Appointments Management - Copy appointment', () => {
  let compiledTemplate: Template

  const tomorrow = addDays(new Date(), 1)

  const appointment = {
    id: 11,
    appointmentName: 'Chaplaincy',
    startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
  } as AppointmentDetails

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should show the appointment details that will be copied', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        appointment,
        csrfToken: 'csrf',
      }),
    )

    expect($('h1').text().trim()).toBe('Copying an appointment')

    expect($('[data-qa="first-paragraph"]').text().replace(/\s+/g, ' ').trim()).toBe(
      `This will create a new appointment, using the details of Chaplaincy from ${formatDate(
        tomorrow,
        'EEEE, d MMMM yyyy',
      )}. It will have the same:`,
    )

    const copiedDetails = $('ul li')
      .map((_, element) => $(element).text().trim())
      .get()

    expect(copiedDetails).toEqual([
      'name',
      'attendees',
      'tier and host',
      'location',
      'start and end times',
      'extra information',
    ])
  })

  it('should allow the user to continue or cancel and return to the original appointment', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        appointment,
        csrfToken: 'csrf',
      }),
    )

    expect($('form').attr('action')).toBe('/appointments/create/start-copy/11')
    expect($('button[type="submit"]').text().trim()).toBe('Continue')

    const cancelLink = $('a').filter((_, element) => $(element).text().includes('Cancel and return to appointment'))

    expect(cancelLink.attr('href')).toBe('/appointments/11')
  })
})
