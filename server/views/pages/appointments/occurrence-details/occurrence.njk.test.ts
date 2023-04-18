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
        startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
        appointmentType: AppointmentType.INDIVIDUAL,
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

  it('should display prisoner summary if individual appointment', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($('[data-qa=prisoner-summary]').length).toBe(1)
    expect($('[data-qa=prisoner-list]').length).toBe(0)
  })

  it('should display prisoner list if group appointment', () => {
    viewContext.occurrence.appointmentType = AppointmentType.GROUP
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($('[data-qa=prisoner-list]').length).toBe(1)
    expect($('[data-qa=prisoner-summary]').length).toBe(0)
  })

  it('should show updated by if occurrence has been updated', () => {
    viewContext.occurrence.updatedBy = {
      id: 123,
      username: 'joebloggs',
      firstName: 'Joe',
      lastName: 'Bloggs',
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($('[data-qa=user-details] .govuk-summary-list__key:contains("Updated by")').next().text().trim()).toBe(
      'J. Bloggs',
    )
  })
})
