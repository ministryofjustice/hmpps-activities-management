import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/review-non-associations.njk')

describe('Views - Appointments Management - Review non-associations', () => {
  let compiledTemplate: Template

  const nonAssociations = [
    {
      primaryPrisoner: {
        name: 'STEPHEN GREGS',
        prisonerNumber: 'A1350DZ',
      },
      nonAssociations: [
        {
          name: 'DAVID WINCHURCH',
          prisonerNumber: 'A8644DY',
          cellLocation: '1-3',
          lastUpdated: '2024-10-30T10:00:00',
        },
      ],
    },
    {
      primaryPrisoner: {
        name: 'DAVID WINCHURCH',
        prisonerNumber: 'A8644DY',
      },
      nonAssociations: [
        {
          name: 'STEPHEN GREGS',
          prisonerNumber: 'A1350DZ',
          cellLocation: '2-2-024',
          lastUpdated: '2024-10-30T10:00:00',
        },
      ],
    },
  ]

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should show attendees with non-associations', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        nonAssociations,
        attendeesTotalCount: 3,
        nonAssociationsUrl: 'https://non-associations.example.com',
        preserveHistory: false,
        csrfToken: 'csrf',
      }),
    )

    expect($('h1').text().replace(/\s+/g, ' ').trim()).toBe('Review 2 people with non-associations')

    expect($('[data-qa="attendee-numbers"]').text().replace(/\s+/g, ' ').trim()).toBe(
      'You’re reviewing 2 people with non-associations out of a total of 3 attendees.',
    )

    expect($('.govuk-summary-card')).toHaveLength(2)

    const stephenCard = $('[data-qa="card-A1350DZ"]').text().replace(/\s+/g, ' ').trim()
    expect(stephenCard).toContain('Stephen Gregs')
    expect(stephenCard).toContain('David Winchurch')
    expect(stephenCard).toContain('A8644DY')
    expect(stephenCard).toContain('1-3')
    expect(stephenCard).toContain('30 October 2024')

    const davidCard = $('[data-qa="card-A8644DY"]').text().replace(/\s+/g, ' ').trim()
    expect(davidCard).toContain('David Winchurch')
    expect(davidCard).toContain('Stephen Gregs')
    expect(davidCard).toContain('A1350DZ')
    expect(davidCard).toContain('2-2-024')
    expect(davidCard).toContain('30 October 2024')

    expect($('[data-qa="remove-attendee-link-A1350DZ"]')).toHaveLength(1)
    expect($('[data-qa="remove-attendee-link-A8644DY"]')).toHaveLength(1)

    expect($('input[name="nonAssociationsRemainingCount"]').attr('value')).toBe('2')
  })

  it('should show when all non-associations have been dealt with', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        nonAssociations: [],
        attendeesTotalCount: 2,
        csrfToken: 'csrf',
      }),
    )

    expect($('h1').text().replace(/\s+/g, ' ').trim()).toBe(
      'You’ve dealt with all the non-associations between this appointment’s attendees',
    )

    expect($('[data-qa="remaining-attendees"]').text().replace(/\s+/g, ' ').trim()).toBe(
      'There are 2 attendees remaining on the appointment list.',
    )

    expect($('.govuk-summary-card')).toHaveLength(0)
    expect($('input[name="nonAssociationsRemainingCount"]').attr('value')).toBe('0')
  })

  it('should use singular wording when one attendee remains', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        nonAssociations: [],
        attendeesTotalCount: 1,
        csrfToken: 'csrf',
      }),
    )

    expect($('[data-qa="remaining-attendees"]').text().replace(/\s+/g, ' ').trim()).toBe(
      'There is one attendee remaining on the appointment list.',
    )
  })
})
