import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/confirm-non-associations.njk')

describe('Views - Appointments Management - Confirm non-associations', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should show the number of attendees with remaining non-associations', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        nonAssociationsCount: 2,
        csrfToken: 'csrf',
      }),
    )

    expect($('h1').text().replace(/\s+/g, ' ').trim()).toBe(
      'Confirm that 2 people with non-assocations can attend this appointment',
    )

    expect($('.govuk-body').text().replace(/\s+/g, ' ').trim()).toBe(
      'If you continue with the current attendee list, there will be 2 attendees who have a non-association with someone else on the appointment.',
    )

    expect($('button[type="submit"]').text().trim()).toBe('Confirm')

    const reviewLink = $('a.govuk-button--secondary')

    expect(reviewLink.text().trim()).toBe('Review non-associations')
    expect(reviewLink.attr('href')).toBe('review-non-associations')
  })
})
