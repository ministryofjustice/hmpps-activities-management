import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentOccurrenceDetails } from '../../../../@types/activitiesAPI/types'
import { formatDate } from '../../../../utils/utils'
import { AppointmentType } from '../../../../routes/appointments/create-and-edit/appointmentJourney'

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
        appointmentType: AppointmentType.INDIVIDUAL,
        startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
        created: formatDate(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      } as AppointmentOccurrenceDetails,
    }
  })

  it('should display category and date in heading', () => {
    viewContext.occurrence.category = {
      code: 'TS1',
      description: 'Test Category',
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=heading]').text().trim()).toBe(
      `Test Category appointment - ${formatDate(tomorrow, 'EEEE d MMMM yyyy')}`,
    )
  })

  it('should show updated by if occurrence has been updated', () => {
    viewContext.occurrence.updated = formatDate(new Date(), "yyyy-MM-dd'T'HH:mm:ss")
    viewContext.occurrence.updatedBy = {
      id: 123,
      username: 'joebloggs',
      firstName: 'Joe',
      lastName: 'Bloggs',
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect(
      $('[data-qa=appointment-history] .govuk-summary-list__key:contains("Last edited by")').next().text().trim(),
    ).toBe('J. Bloggs')
  })
})
