import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { YesNo } from '../../../../@types/activities'
import { AppointmentType, CreateAppointmentJourney } from '../../../../routes/appointments/create/journey'

const view = fs.readFileSync('server/views/pages/appointments/create/repeat.njk')

describe('Views - Create Appointment - Repeat', () => {
  let compiledTemplate: Template
  let viewContext = {
    session: {
      createAppointmentJourney: { type: AppointmentType.INDIVIDUAL } as CreateAppointmentJourney,
    },
    formResponses: {},
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      session: {
        createAppointmentJourney: { type: AppointmentType.INDIVIDUAL } as CreateAppointmentJourney,
      },
      formResponses: {},
    }
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

    const checked = $("[name='repeat']:checked")
    expect(checked.length).toEqual(1)
    expect(checked.val()).toEqual(repeat.toString())
  })

  it.each([YesNo.NO, YesNo.YES])('should check correct input based on session value response %s', repeat => {
    viewContext.session.createAppointmentJourney.repeat = repeat

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    const checked = $("[name='repeat']:checked")
    expect(checked.length).toEqual(1)
    expect(checked.val()).toEqual(repeat.toString())
  })

  it('should prioritise form response value over session value', () => {
    viewContext.formResponses = {
      repeat: YesNo.NO,
    }
    viewContext.session.createAppointmentJourney.repeat = YesNo.YES

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    const checked = $("[name='repeat']:checked")
    expect(checked.length).toEqual(1)
    expect(checked.val()).toEqual(YesNo.NO.toString())
  })

  describe('Individual Appointment', () => {
    it('should display journey title', () => {
      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=caption]').text()).toBe('Individual appointment')
    })
  })

  describe('Group Appointment', () => {
    beforeEach(() => {
      viewContext.session.createAppointmentJourney.type = AppointmentType.GROUP
    })

    it('should display journey title', () => {
      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=caption]').text()).toBe('Group appointment')
    })
  })
})
