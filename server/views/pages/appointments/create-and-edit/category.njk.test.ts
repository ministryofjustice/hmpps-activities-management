import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentType, AppointmentJourney } from '../../../../routes/appointments/create-and-edit/appointmentJourney'

let $: CheerioAPI
const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/category.njk')

describe('Views - Create Appointment - Category', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown> = {}

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      session: {
        appointmentJourney: {} as AppointmentJourney,
      },
    }
  })

  it('should link back to the select prisoner page if not a bulk appointment', () => {
    viewContext.session = {
      appointmentJourney: {
        type: AppointmentType.INDIVIDUAL,
        prisoners: [
          {
            number: 'A1234AA',
          },
        ],
      },
    }
    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.govuk-back-link').first().attr('href')).toEqual('/appointments/create/select-prisoner?query=A1234AA')
  })

  it('should link back to the review prisoners page if a bulk appointment', () => {
    viewContext.session = {
      appointmentJourney: {
        type: AppointmentType.BULK,
      },
    }
    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.govuk-back-link').first().attr('href')).toEqual('/appointments/create/review-prisoners')
  })
})
