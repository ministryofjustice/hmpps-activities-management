import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../../nunjucks/nunjucksSetup'
import { AppointmentJourney } from '../../../../../routes/appointments/create-and-edit/appointmentJourney'

let $: CheerioAPI
const view = fs.readFileSync(
  'server/views/pages/appointments/create-and-edit/appointment-set/add-extra-information.njk',
)

describe('Views - Create Appointment Set - Add Extra Information', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown> = {}

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
    viewContext = {
      session: {
        appointmentJourney: {} as AppointmentJourney,
      },
    }
  })

  it('should display existing extra information in textbox', () => {
    viewContext.extraInformation = 'existing extra information'

    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('#extraInformation').val()).toEqual('existing extra information')
  })

  it('should display prisoner information in the heading', () => {
    viewContext.prisoner = {
      number: 'A1234AA',
      name: 'John Smith',
    }

    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text()).toEqual("Add extra information to John Smith's movement slip (optional)")
    expect($('[data-qa=first-paragraph]').text().trim()).toEqual(
      "For example, 'You need to bring all your documents about your case to this meeting with your solicitor.'",
    )
    expect($('[data-qa=second-paragraph]').text().trim()).toEqual(
      'Do not add anything that should not be seen by or shared with a prisoner. For example, contact details of someone else at the appointment.',
    )
  })
})
