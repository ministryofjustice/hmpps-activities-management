import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentRepeatPeriod } from '../../../../@types/activitiesAPI/types'
import { AppointmentType, CreateAppointmentJourney } from '../../../../routes/appointments/create/journey'

const view = fs.readFileSync('server/views/pages/appointments/create/repeat-period-and-count.njk')

describe('Views - Create Individual Appointment - Repeat Period and Count', () => {
  let compiledTemplate: Template
  let viewContext = {
    session: {
      createAppointmentJourney: { type: AppointmentType.SINGLE } as CreateAppointmentJourney,
    },
    formResponses: {},
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      session: {
        createAppointmentJourney: { type: AppointmentType.SINGLE } as CreateAppointmentJourney,
      },
      formResponses: {},
    }
  })

  it('should display journey title', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=caption]').text()).toBe('Individual appointment')
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
    AppointmentRepeatPeriod.WEEKDAY,
    AppointmentRepeatPeriod.DAILY,
    AppointmentRepeatPeriod.WEEKLY,
    AppointmentRepeatPeriod.FORTNIGHTLY,
    AppointmentRepeatPeriod.MONTHLY,
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
    AppointmentRepeatPeriod.WEEKDAY,
    AppointmentRepeatPeriod.DAILY,
    AppointmentRepeatPeriod.WEEKLY,
    AppointmentRepeatPeriod.FORTNIGHTLY,
    AppointmentRepeatPeriod.MONTHLY,
  ])('should check correct input based on session value response %s', repeatPeriod => {
    viewContext.session.createAppointmentJourney.repeatPeriod = repeatPeriod

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    const checked = $("[name='repeatPeriod']:checked")
    expect(checked.length).toEqual(1)
    expect(checked.val()).toEqual(repeatPeriod.toString())
  })

  it('should prioritise form response value over session value', () => {
    viewContext.formResponses = {
      repeatPeriod: AppointmentRepeatPeriod.WEEKLY,
    }
    viewContext.session.createAppointmentJourney.repeatPeriod = AppointmentRepeatPeriod.FORTNIGHTLY

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    const checked = $("[name='repeatPeriod']:checked")
    expect(checked.length).toEqual(1)
    expect(checked.val()).toEqual(AppointmentRepeatPeriod.WEEKLY.toString())
  })
})
