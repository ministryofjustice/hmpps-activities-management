import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../../nunjucks/nunjucksSetup'
import { AppointmentJourney } from '../../../../../routes/appointments/create-and-edit/appointmentJourney'
import config from '../../../../../config'

let $: CheerioAPI
const view = fs.readFileSync(
  'server/views/pages/appointments/create-and-edit/appointment-set/add-extra-information.njk',
)

let compiledTemplate: Template
let viewContext: Record<string, unknown> = {}

describe('Views - Create Appointment Set - Add Extra Information - with feature toggle off', () => {
  config.prisonerExtraInformationEnabled = false

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

describe('Views - Create Appointment Set - Add Extra Information - with feature toggle on', () => {
  config.prisonerExtraInformationEnabled = true

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
      "This could include details about who will be attending, or other relevant appointment information. This won't appear on movement slips or the printed unlock list. Unlock lists will just show 'Extra information'. Staff can view fill details in the service.\n" +
        '                            \n' +
        '                              Add or edit information the prisoner needs to know about their appointment, like something they need to, or do beforehand. This will appear on movement slips and will be seen by the prisoner. Changes will not appear on movement slips that have already been printed.',
    )
    expect($('[data-qa=second-paragraph]').text().trim()).toEqual(
      'Do not add anything that should not be seen by or shared with a prisoner.',
    )
  })
})
