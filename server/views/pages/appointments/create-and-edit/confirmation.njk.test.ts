import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays, format } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { YesNo } from '../../../../@types/activities'
import { AppointmentType, AppointmentJourney } from '../../../../routes/appointments/create-and-edit/appointmentJourney'
import { AppointmentRepeatPeriod } from '../../../../@types/appointments'

const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/confirmation.njk')

describe('Views - Create Appointment - Check Answers', () => {
  let compiledTemplate: Template
  const tomorrow = addDays(new Date(), 1)
  let viewContext = {
    session: {
      appointmentJourney: { type: AppointmentType.INDIVIDUAL } as AppointmentJourney,
    },
    startDate: tomorrow,
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      session: {
        appointmentJourney: { type: AppointmentType.INDIVIDUAL } as AppointmentJourney,
      },
      startDate: tomorrow,
    }
  })

  it('should not display repeat frequency or occurrences when repeat = NO', () => {
    viewContext.session.appointmentJourney = {
      type: AppointmentType.INDIVIDUAL,
      prisoners: [
        {
          name: 'TEST PRISONER',
          number: 'A1234BC',
          cellLocation: '1-2-3',
        },
      ],
      repeat: YesNo.NO,
    } as AppointmentJourney

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
      `You have successfully created an appointment for Test Prisoner on ${format(tomorrow, 'EEEE d MMMM yyyy')}.`,
    )
  })

  it.each([
    { repeatPeriod: AppointmentRepeatPeriod.WEEKDAY, expectedText: 'every weekday (Monday to Friday)' },
    { repeatPeriod: AppointmentRepeatPeriod.DAILY, expectedText: 'daily (includes weekends)' },
    { repeatPeriod: AppointmentRepeatPeriod.WEEKLY, expectedText: 'weekly' },
    { repeatPeriod: AppointmentRepeatPeriod.FORTNIGHTLY, expectedText: 'fortnightly' },
    { repeatPeriod: AppointmentRepeatPeriod.MONTHLY, expectedText: 'monthly' },
  ])(
    'frequency $repeatPeriod should be displayed as $expectedText with occurrences when repeat = YES',
    ({ repeatPeriod, expectedText }) => {
      viewContext.session.appointmentJourney = {
        type: AppointmentType.INDIVIDUAL,
        prisoners: [
          {
            name: 'TEST PRISONER',
            number: 'A1234BC',
            cellLocation: '1-2-3',
          },
        ],
        repeat: YesNo.YES,
        repeatPeriod,
        repeatCount: 6,
      } as AppointmentJourney

      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
        `You have successfully created an appointment for Test Prisoner starting on ${format(
          tomorrow,
          'EEEE d MMMM yyyy',
        )}. It will repeat ${expectedText} for 6 occurrences`,
      )
    },
  )

  describe('Group Appointment', () => {
    it('should display number of prisoners added to appointment', () => {
      viewContext.session.appointmentJourney = {
        type: AppointmentType.GROUP,
        prisoners: [
          {
            name: 'TEST PRISONER',
            number: 'A1234BC',
            cellLocation: '1-2-3',
          },
          {
            name: 'SECOND PRISONER',
            number: 'A1234BD',
            cellLocation: '3-2-1',
          },
          {
            name: 'THIRD PRISONER',
            number: 'A1234BE',
            cellLocation: '3-3-3',
          },
        ],
        repeat: YesNo.NO,
      } as AppointmentJourney

      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
        `You have successfully created an appointment for 3 prisoners on ${format(tomorrow, 'EEEE d MMMM yyyy')}.`,
      )
    })
  })
})
