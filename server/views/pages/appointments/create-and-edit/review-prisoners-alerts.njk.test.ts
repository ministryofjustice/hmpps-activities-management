import * as cheerio from 'cheerio'
import fs from 'fs'
import { compile, Template } from 'nunjucks'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import {
  AppointmentJourneyMode,
  AppointmentType,
} from '../../../../routes/appointments/create-and-edit/appointmentJourney'

const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/review-prisoners-alerts.njk')

describe('Views - Appointments Management - Review prisoner alerts', () => {
  let compiledTemplate: Template

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), registerNunjucks())
  })

  it('renders badge alerts and their descriptions', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        appointmentJourney: {
          mode: AppointmentJourneyMode.CREATE,
          type: AppointmentType.GROUP,
        },
        dpsUrl: 'https://digital-dev.prison.service.justice.gov.uk',
        alertsDetails: {
          numPrisonersWithAlerts: 1,
          prisoners: [
            {
              number: 'A1234BC',
              name: 'TEST PRISONER',
              category: 'A',
              alerts: [{ alertCode: 'XA' }, { alertCode: 'XCO' }, { alertCode: 'RNO121' }, { alertCode: 'XTACT' }],
              alertDescriptions: [
                'Arsonist',
                'Corruptor',
                'No 1 to 1 with this prisoner',
                'Terrorism Act or Related Offence',
              ],
              hasBadgeAlerts: true,
              hasRelevantCategories: true,
            },
          ],
        },
      }),
    )

    expect($('.alerts-list').text()).toContain('Arsonist')
    expect($('.alerts-list').text()).toContain('CAT A')
    expect($('.alerts-list').text()).toContain('Corruptor')
    expect($('.alerts-list').text()).toContain('No one-to-one')
    expect($('.alerts-list').text()).toContain('TACT')
    expect($('[data-qa="alert-descriptions"]').text()).toContain('Arsonist')
    expect($('[data-qa="alert-descriptions"]').text()).toContain('Terrorism Act or Related Offence')
  })
})
