import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentType, AppointmentJourney } from '../../../../routes/appointments/create-and-edit/appointmentJourney'
import { AppointmentFrequency } from '../../../../@types/appointments'

const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/repeat-frequency-and-count.njk')

describe('Views - Create Appointment - Repeat Period and Count', () => {
  let compiledTemplate: Template
  let viewContext = {
    session: {
      appointmentJourney: { type: AppointmentType.INDIVIDUAL } as AppointmentJourney,
    },
    formResponses: {},
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      session: {
        appointmentJourney: { type: AppointmentType.INDIVIDUAL } as AppointmentJourney,
      },
      formResponses: {},
    }
  })

  it('should contain enum WEEKDAY, DAILY, WEEKLY, FORTNIGHTLY and MONTHLY inputs', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(
      $("[name='repeatPeriod']")
        .map((i, e) => $(e).val())
        .get(),
    ).toEqual(['WEEKDAY', 'DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY'])
  })

  it('should contain enum equivalent WEEKDAY, DAILY, WEEKLY, FORTNIGHTLY and MONTHLY labels', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(
      $("label[for^='repeatPeriod']")
        .map((i, e) => $(e).text().trim())
        .get(),
    ).toEqual(['Every weekday (Monday to Friday)', 'Daily (includes weekends)', 'Weekly', 'Fortnightly', 'Monthly'])
  })

  it.each([
    AppointmentFrequency.WEEKDAY,
    AppointmentFrequency.DAILY,
    AppointmentFrequency.WEEKLY,
    AppointmentFrequency.FORTNIGHTLY,
    AppointmentFrequency.MONTHLY,
  ])('should check correct input based on form response %s', repeatPeriod => {
    viewContext.formResponses = {
      repeatPeriod,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    const checked = $("[name='repeatPeriod']:checked")
    expect(checked.length).toEqual(1)
    expect(checked.val()).toEqual(repeatPeriod.toString())
  })

  it.each([
    AppointmentFrequency.WEEKDAY,
    AppointmentFrequency.DAILY,
    AppointmentFrequency.WEEKLY,
    AppointmentFrequency.FORTNIGHTLY,
    AppointmentFrequency.MONTHLY,
  ])('should check correct input based on session value response %s', repeatPeriod => {
    viewContext.session.appointmentJourney.frequency = repeatPeriod

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    const checked = $("[name='repeatPeriod']:checked")
    expect(checked.length).toEqual(1)
    expect(checked.val()).toEqual(repeatPeriod.toString())
  })

  it('should prioritise form response value over session value', () => {
    viewContext.formResponses = {
      repeatPeriod: AppointmentFrequency.WEEKLY,
    }
    viewContext.session.appointmentJourney.frequency = AppointmentFrequency.FORTNIGHTLY

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    const checked = $("[name='repeatPeriod']:checked")
    expect(checked.length).toEqual(1)
    expect(checked.val()).toEqual(AppointmentFrequency.WEEKLY.toString())
  })

  describe('Individual Appointment', () => {
    it('should display journey title', () => {
      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=caption]').text()).toBe('Schedule an appointment')
    })
  })

  describe('Group Appointment', () => {
    beforeEach(() => {
      viewContext.session.appointmentJourney.type = AppointmentType.GROUP
    })

    it('should display journey title', () => {
      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=caption]').text()).toBe('Schedule an appointment')
    })
  })
})
