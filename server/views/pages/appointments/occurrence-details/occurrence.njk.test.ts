import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentOccurrenceDetails } from '../../../../@types/activitiesAPI/types'
import { formatDate } from '../../../../utils/utils'

const view = fs.readFileSync('server/views/pages/appointments/occurrence-details/occurrence.njk')

describe('Views - Appointments Management - Appointment Occurrence Details', () => {
  let compiledTemplate: Template
  const tomorrow = addDays(new Date(), 1)
  let viewContext = {
    occurrence: {} as AppointmentOccurrenceDetails,
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      occurrence: {
        startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
      } as AppointmentOccurrenceDetails,
    }
  })

  it('should display category and date in heading', () => {
    viewContext.occurrence.category = {
      id: 1,
      code: 'TS1',
      description: 'Test Category',
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=heading]').text().trim()).toBe(
      `Test Category appointment - ${formatDate(tomorrow, 'EEEE d MMMM yyyy')}`,
    )
  })
})
