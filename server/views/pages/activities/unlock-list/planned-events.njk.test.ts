import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/unlock-list/planned-events.njk')

describe('Views - Unlock list', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
    viewContext = {
      location: {
        name: 'Wing A',
        key: 'WING_A',
      },
      date: '2024-01-15',
      timeSlot: 'AM',
      movementCounts: {
        leavingWing: 2,
        stayingOnWing: 1,
      },
      unlockListItems: [
        {
          prisonerNumber: 'A1111AA',
          isLeavingWing: true,
          firstName: 'John',
          lastName: 'Doe',
          cellLocation: '1-1-001',
          alerts: [],
          events: [],
        },
        {
          prisonerNumber: 'B2222BB',
          isLeavingWing: true,
          firstName: 'Jane',
          lastName: 'Smith',
          cellLocation: '1-1-002',
          alerts: [],
          events: [],
        },
        {
          prisonerNumber: 'C3333CC',
          isLeavingWing: false,
          firstName: 'Bob',
          lastName: 'Jones',
          cellLocation: '1-1-003',
          alerts: [],
          events: [],
        },
      ],
      unlockListJourney: {
        searchTerm: '',
        alertFilters: [],
      },
      user: {
        username: 'TEST_USER',
        roles: [],
        activeCaseLoadId: 'MDI',
      },
    }
  })

  it('search unlock list', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text().trim()).toEqual('Wing A - Unlock list')
    expect($('.govuk-caption-l').eq(0).text().trim()).toEqual('AM session')
    expect($('.govuk-caption-l').eq(1).text().trim()).toEqual('Monday, 15 January 2024')
    expect(
      $('.govuk-body')
        .map((i, e) => $(e).text().trim())
        .get(),
    ).toContain('3 people to unlock')
    expect(
      $('.govuk-body')
        .map((i, e) => $(e).text().trim())
        .get(),
    ).toContain('2 leaving wing')
    expect(
      $('.govuk-body')
        .map((i, e) => $(e).text().trim())
        .get(),
    ).toContain('1 staying on wing')
    expect($('.govuk-form-group > .govuk-label').text().trim()).toEqual(
      'Search by name or prison number, or event name',
    )
    expect($('.search-input__form-inputs > .govuk-button').text().trim()).toEqual('Search')
  })
})
