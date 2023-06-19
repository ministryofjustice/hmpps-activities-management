import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../../nunjucks/nunjucksSetup'
import { AppointmentJourney } from '../../../../../routes/appointments/create-and-edit/appointmentJourney'

let $: CheerioAPI
const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/bulk-appointments/add-comment.njk')

describe('Views - Create Bulk Appointment - Add Comment', () => {
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

  it('should display existing comment in textbox', () => {
    viewContext.comment = 'existing comment'

    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('#comment').val()).toEqual('existing comment')
  })

  it('should display prisoner information in the heading', () => {
    viewContext.prisoner = {
      number: 'A1234AA',
      name: 'John Smith',
    }

    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text()).toEqual('Add extra information for John Smith, A1234AA')
  })
})
