import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentDetails } from '../../../../@types/activitiesAPI/types'
import { formatDate } from '../../../../utils/utils'
import { AppointmentType } from '../../../../routes/appointments/create-and-edit/appointmentJourney'

const view = fs.readFileSync('server/views/pages/appointments/occurrence-details/occurrence.njk')

describe('Views - Appointments Management - Appointment Occurrence Details', () => {
  let compiledTemplate: Template
  const tomorrow = addDays(new Date(), 1)
  let viewContext: { occurrence: AppointmentDetails } = {
    occurrence: {} as AppointmentDetails,
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      occurrence: {
        id: 10,
        appointmentId: 5,
        appointmentType: AppointmentType.INDIVIDUAL,
        prisoners: [
          {
            firstName: 'TEST',
            lastName: 'PRISONER',
            prisonerNumber: 'A1234BC',
            prisonCode: 'MDI',
            cellLocation: '1-2-3',
          },
        ],
        startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
        startTime: '23:59',
        isCancelled: false,
        isExpired: false,
        created: formatDate(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      } as AppointmentDetails,
    }
  })

  it('should display name in heading', () => {
    viewContext.occurrence.appointmentName = 'Test Category'

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=heading]').text().trim()).toBe('Test Category')
  })

  it('should display date in sub heading', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=sub-heading]').text().trim()).toBe(formatDate(tomorrow, 'EEEE, d MMMM yyyy'))
  })

  it('print movement slip link should open in new tab', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=print-movement-slips]').attr('target')).toBe('_blank')
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

  it('should show number of attendees for group appointments', () => {
    viewContext = {
      occurrence: {
        id: 10,
        appointmentId: 5,
        appointmentType: AppointmentType.GROUP,
        prisoners: [
          {
            firstName: 'TEST 1',
            lastName: 'PRISONER 1',
            prisonerNumber: 'A1234BC',
            prisonCode: 'MDI',
            cellLocation: '1-2-3',
          },
          {
            firstName: 'TEST 2',
            lastName: 'PRISONER 2',
            prisonerNumber: 'A1234BD',
            prisonCode: 'MDI',
            cellLocation: '1-2-3',
          },
        ],
        startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
        startTime: '23:59',
        isCancelled: false,
        isExpired: false,
        created: formatDate(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      } as AppointmentDetails,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($('[data-qa=prisoner-list-title]').text().trim()).toContain('2 attendees')
  })
})
