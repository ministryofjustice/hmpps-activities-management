import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentRepeatPeriod } from '../../../../@types/activitiesAPI/types'
import { YesNo } from '../../../../@types/activities'
import { CreateSingleAppointmentJourney } from '../../../../routes/appointments/create-single/journey'

const view = fs.readFileSync('server/views/pages/appointments/create-single/check-answers.njk')

describe('Views - Create Individual Appointment - Check Answers', () => {
  let compiledTemplate: Template
  const tomorrow = addDays(new Date(), 1)
  let viewContext = {
    session: {
      createSingleAppointmentJourney: { title: 'Individual appointment' } as CreateSingleAppointmentJourney,
    },
    startDate: tomorrow,
    startTime: tomorrow.setHours(9, 30),
    endTime: tomorrow.setHours(10, 0),
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      session: {
        createSingleAppointmentJourney: { title: 'Individual appointment' } as CreateSingleAppointmentJourney,
      },
      startDate: tomorrow,
      startTime: tomorrow.setHours(9, 30),
      endTime: tomorrow.setHours(10, 0),
    }
  })

  it('should not display repeat frequency or occurrences when repeat = NO', () => {
    viewContext.session.createSingleAppointmentJourney.repeat = YesNo.NO

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=repeat-period]').length).toBe(0)
    expect($('[data-qa=repeat-count]').length).toBe(0)
  })

  it.each([
    { repeatPeriod: AppointmentRepeatPeriod.WEEKDAY, expectedText: 'Every weekday (Monday to Friday)' },
    { repeatPeriod: AppointmentRepeatPeriod.DAILY, expectedText: 'Daily (includes weekends)' },
    { repeatPeriod: AppointmentRepeatPeriod.WEEKLY, expectedText: 'Weekly' },
    { repeatPeriod: AppointmentRepeatPeriod.FORTNIGHTLY, expectedText: 'Fortnightly' },
    { repeatPeriod: AppointmentRepeatPeriod.MONTHLY, expectedText: 'Monthly' },
  ])('frequency $repeatPeriod be displayed as $expectedText', ({ repeatPeriod, expectedText }) => {
    viewContext.session.createSingleAppointmentJourney.repeat = YesNo.YES
    viewContext.session.createSingleAppointmentJourney.repeatPeriod = repeatPeriod

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=repeat-period]').text().trim()).toEqual(expectedText)
    expect($('[data-qa=repeat-count]').length).toBeGreaterThan(0)
  })
})
