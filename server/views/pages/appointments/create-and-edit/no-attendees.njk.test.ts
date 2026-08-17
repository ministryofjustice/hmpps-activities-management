import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentJourney } from '../../../../routes/appointments/create-and-edit/appointmentJourney'

const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/no-attendees.njk')

describe('Views - Appointments Management - No attendees', () => {
  let compiledTemplate: Template

  const appointmentJourney = {
    appointmentName: 'Chaplaincy',
    startDate: '2023-04-13',
    originalAppointmentId: 11,
  } as AppointmentJourney

  const viewContext = {
    appointmentJourney,
    user: {
      activeCaseLoad: {
        description: 'Moorland (HMP)',
      },
    },
    csrfToken: 'csrf',
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should explain that all copied attendees have left the prison', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text().trim()).toBe('There are no attendees for this appointment')

    const paragraphs = $('p')
      .map((_, element) => $(element).text().replace(/\s+/g, ' ').trim())
      .get()

    expect(paragraphs).toContain('Attendees from Chaplaincy on Thursday, 13 April 2023 have left Moorland (HMP).')
    expect(paragraphs).toContain('If you want to continue copying the appointment, you must add someone.')
  })

  it('should allow the user to add someone or cancel and return to the original appointment', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('form').attr('method')).toBe('POST')
    expect($('form').attr('action')).toBe('no-attendees')
    expect($('button[type="submit"]').text().trim()).toBe('Add someone to the list')

    const cancelLink = $('a').filter((_, element) => $(element).text().includes('Cancel and return to appointment'))

    expect(cancelLink.attr('href')).toBe('/appointments/11')
  })
})
