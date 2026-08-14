import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'

import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentType } from '../../../../routes/appointments/create-and-edit/appointmentJourney'

const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/review-non-associations-edit.njk')

describe('Views - Appointments Management - Review non-associations when editing', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  const baseContext = {
    session: {
      appointmentJourney: {
        type: AppointmentType.GROUP,
      },
    },
    appointmentId: 12,
    nonAssociationsUrl: 'https://non-associations.example.com',
    preserveHistory: false,
    csrfToken: 'csrf',
  }

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should show a non-association between a new attendee and someone already attending', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        ...baseContext,
        additionalAttendeesCount: 1,
        existingAttendeesCount: 1,
        existingPrisonerNumbers: ['A1350DZ'],
        nonAssociations: [
          {
            primaryPrisoner: {
              name: 'AETICAKE POTTA',
              prisonerNumber: 'G0995GW',
            },
            nonAssociations: [
              {
                name: 'DAVID WINCHURCH',
                prisonerNumber: 'A1350DZ',
                cellLocation: '2-2-024',
                lastUpdated: '2024-10-30T10:00:00',
              },
            ],
          },
        ],
      }),
    )

    expect($('h1').text().replace(/\s+/g, ' ').trim()).toBe('Review non-associations for Aeticake Potta')

    expect($('.govuk-summary-card')).toHaveLength(1)

    const card = $('[data-qa="card-G0995GW"]').text().replace(/\s+/g, ' ').trim()

    expect(card).toContain('David Winchurch')
    expect(card).toContain('Already attending')
    expect(card).toContain('A1350DZ')
    expect(card).toContain('2-2-024')
    expect(card).toContain('30 October 2024')

    expect($('[data-qa="remove-attendee-link-G0995GW"]')).toHaveLength(1)
  })

  it('should show non-associations between two new attendees', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        ...baseContext,
        additionalAttendeesCount: 2,
        existingAttendeesCount: 1,
        existingPrisonerNumbers: ['A1350DZ'],
        nonAssociations: [
          {
            primaryPrisoner: {
              name: 'AETICAKE POTTA',
              prisonerNumber: 'G0995GW',
            },
            nonAssociations: [
              {
                name: 'JOHN SAUNDERS',
                prisonerNumber: 'G6123VU',
                cellLocation: '2-2-024',
                lastUpdated: '2024-10-30T10:00:00',
              },
            ],
          },
          {
            primaryPrisoner: {
              name: 'JOHN SAUNDERS',
              prisonerNumber: 'G6123VU',
            },
            nonAssociations: [
              {
                name: 'AETICAKE POTTA',
                prisonerNumber: 'G0995GW',
                cellLocation: '1-3',
                lastUpdated: '2024-10-30T10:00:00',
              },
            ],
          },
        ],
      }),
    )

    expect($('h1').text().replace(/\s+/g, ' ').trim()).toBe('Review non-associations for 2 people you’re adding')

    expect($('.govuk-summary-card')).toHaveLength(2)

    const pottaCard = $('[data-qa="card-G0995GW"]').text().replace(/\s+/g, ' ').trim()

    expect(pottaCard).toContain('John Saunders')
    expect(pottaCard).not.toContain('Already attending')
    expect(pottaCard).toContain('G6123VU')
    expect(pottaCard).toContain('2-2-024')
    expect(pottaCard).toContain('30 October 2024')

    const saundersCard = $('[data-qa="card-G6123VU"]').text().replace(/\s+/g, ' ').trim()

    expect(saundersCard).toContain('Aeticake Potta')
    expect(saundersCard).not.toContain('Already attending')
    expect(saundersCard).toContain('G0995GW')
    expect(saundersCard).toContain('1-3')
    expect(saundersCard).toContain('30 October 2024')
  })

  it('should show the empty state when the last new attendee has been removed', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        ...baseContext,
        additionalAttendeesCount: 0,
        existingAttendeesCount: 1,
        existingPrisonerNumbers: ['A1350DZ'],
        nonAssociations: [],
      }),
    )

    expect($('h1').text().trim()).toBe('There are no attendees to add')

    expect($('body').text().replace(/\s+/g, ' ').trim()).toContain('You’ve removed the last new attendee.')

    expect($('[data-qa="add-prisoner-primary"]').text().trim()).toBe('Add someone to the list')

    expect($('[data-qa="add-prisoner-primary"]').attr('href')).toBe('how-to-add-prisoners')
  })
})
