import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { YesNo } from '../../../../@types/activities'
import { CreateSingleAppointmentJourney } from '../../../../routes/appointments/create-single/journey'

const view = fs.readFileSync('server/views/pages/appointments/create-single/repeat.njk')

describe('Views - Create Individual Appointment - Repeat', () => {
  let compiledTemplate: Template
  let viewContext = {
    session: {
      createSingleAppointmentJourney: { title: 'Individual appointment' } as CreateSingleAppointmentJourney,
    },
    formResponses: {},
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      session: {
        createSingleAppointmentJourney: { title: 'Individual appointment' } as CreateSingleAppointmentJourney,
      },
      formResponses: {},
    }
  })

  it('should display journey title', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=caption]').text()).toBe('Individual appointment')
  })

  it('should contain enum YES and NO inputs', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(
      $("[name='repeat']")
        .map((i, e) => $(e).val())
        .get(),
    ).toEqual(['YES', 'NO'])
  })

  it.each([YesNo.NO, YesNo.YES])('should check correct input based on form response %s', repeat => {
    viewContext.formResponses = {
      repeat,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($("[name='repeat']:checked").val()).toEqual(repeat.toString())
  })

  it.each([YesNo.NO, YesNo.YES])('should check correct input based on session value response %s', repeat => {
    viewContext.session.createSingleAppointmentJourney.repeat = repeat

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($("[name='repeat']:checked").val()).toEqual(repeat.toString())
  })
})
