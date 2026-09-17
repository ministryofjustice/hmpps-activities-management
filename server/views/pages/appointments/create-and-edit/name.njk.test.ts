import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import {
  AppointmentJourney,
  AppointmentJourneyMode,
  AppointmentType,
} from '../../../../routes/appointments/create-and-edit/appointmentJourney'

const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/name.njk')

describe('Views - Appointments Management - Name', () => {
  let compiledTemplate: Template
  let viewContext: {
    appointmentJourney: AppointmentJourney
    categories: object[]
    backLink?: { href: string; text: string }
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
    viewContext = {
      appointmentJourney: {
        mode: AppointmentJourneyMode.CREATE,
        type: AppointmentType.GROUP,
        prisoners: [],
      },
      categories: [],
    }
  })

  it('uses the browser history back link for a standard journey', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.govuk-back-link').text().trim()).toEqual('Back')
    expect($('.govuk-back-link').hasClass('js-backlink')).toBe(true)
    expect($('meta[name="browserBackRedirect"]')).toHaveLength(0)
  })

  it('links to review attendees and redirects browser back for a journey started from confirmation', () => {
    viewContext.backLink = {
      href: '/appointments/create/journeyId/review-prisoners',
      text: 'Review and edit attendees',
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))
    const backLink = $('.govuk-back-link')

    expect(backLink.text().trim()).toEqual('Review and edit attendees')
    expect(backLink.attr('href')).toEqual('/appointments/create/journeyId/review-prisoners')
    expect(backLink.hasClass('js-backlink')).toBe(false)
    expect($('meta[name="browserBackRedirect"]').attr('content')).toEqual(
      '/appointments/create/journeyId/review-prisoners',
    )
  })
})
