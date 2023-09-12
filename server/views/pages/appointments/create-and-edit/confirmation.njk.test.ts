import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays, format } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentType } from '../../../../routes/appointments/create-and-edit/appointmentJourney'
import { AppointmentFrequency } from '../../../../@types/appointments'
import { AppointmentSeriesDetails } from '../../../../@types/activitiesAPI/types'
import { formatDate } from '../../../../utils/utils'

const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/confirmation.njk')

describe('Views - Create Appointment - Check Answers', () => {
  let compiledTemplate: Template
  const tomorrow = addDays(new Date(), 1)
  const viewContext = {
    appointment: {} as AppointmentSeriesDetails,
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
  })

  it('should not display repeat frequency or occurrences when repeat = NO', () => {
    viewContext.appointment = {
      appointmentType: AppointmentType.INDIVIDUAL,
      startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
      prisoners: [
        {
          firstName: 'TEST',
          lastName: 'PRISONER',
        },
      ],
      repeat: null,
    } as AppointmentSeriesDetails

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
      `You have successfully scheduled an appointment for Test Prisoner on ${format(tomorrow, 'EEEE, d MMMM yyyy')}.`,
    )
  })

  it.each([
    { repeatPeriod: AppointmentFrequency.WEEKDAY, expectedText: 'every weekday (Monday to Friday)' },
    { repeatPeriod: AppointmentFrequency.DAILY, expectedText: 'daily (includes weekends)' },
    { repeatPeriod: AppointmentFrequency.WEEKLY, expectedText: 'weekly' },
    { repeatPeriod: AppointmentFrequency.FORTNIGHTLY, expectedText: 'fortnightly' },
    { repeatPeriod: AppointmentFrequency.MONTHLY, expectedText: 'monthly' },
  ])(
    'frequency $repeatPeriod should be displayed as $expectedText with occurrences when repeat = YES',
    ({ repeatPeriod, expectedText }) => {
      viewContext.appointment = {
        appointmentType: AppointmentType.INDIVIDUAL,
        startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
        prisoners: [
          {
            firstName: 'TEST',
            lastName: 'PRISONER',
          },
        ],
        repeat: {
          period: repeatPeriod,
          count: 6,
        },
      } as AppointmentSeriesDetails

      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
        `You have successfully scheduled an appointment for Test Prisoner starting on ${format(
          tomorrow,
          'EEEE, d MMMM yyyy',
        )}. It will repeat ${expectedText} for 6 appointments`,
      )
    },
  )

  describe('Group Appointment', () => {
    it('should display number of prisoners added to appointment', () => {
      viewContext.appointment = {
        appointmentType: AppointmentType.GROUP,
        startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
        prisoners: [
          {
            firstName: 'TEST',
            lastName: 'PRISONER',
          },
          {
            firstName: 'SECOND',
            lastName: 'PRISONER',
          },
          {
            firstName: 'THIRD',
            lastName: 'PRISONER',
          },
        ],
        repeat: null,
      } as AppointmentSeriesDetails

      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
        `You have successfully scheduled an appointment for 3 people on ${format(tomorrow, 'EEEE, d MMMM yyyy')}.`,
      )
    })
  })
})
