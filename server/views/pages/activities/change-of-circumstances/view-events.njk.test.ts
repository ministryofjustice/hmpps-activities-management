import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { changeFilters } from '../../../../routes/activities/change-of-circumstances/handlers/changeFilters'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const snippet = fs.readFileSync('server/views/pages/activities/change-of-circumstances/view-events.njk')

describe('Views - Changes in circumstances', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(snippet.toString(), njkEnv)
  })

  it.each([
    ['today', '2026-08-22', true, false, 'There are no changes to show for today.'],
    ['yesterday', '2026-08-21', false, true, 'There are no changes to show for yesterday.'],
    ['a chosen date', '2024-09-22', false, false, 'There are no changes to show for 22 September 2024.'],
  ])('should show the correct empty state for %s', (_, date, isToday, isYesterday, expectedMessage) => {
    const $ = cheerio.load(
      compiledTemplate.render({
        changeEvents: [],
        date,
        isToday,
        isYesterday,
        user: { activeCaseLoadId: 'MDI' },
      }),
    )

    expect($('[data-qa="no-data-p"]').text()).toContain(expectedMessage)
    expect($('[data-qa="no-data-link"]').attr('href')).toBe('/activities/change-of-circumstances/select-period')
    expect($('#changeEvents')).toHaveLength(0)
  })
  it('renders all six filters unselected by default and Clear retains only the date', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        date: '2023-05-16',
        changeEvents: [],
        selectedFilters: [],
        filterItems: changeFilters.map(({ value, text }) => ({ value, text, checked: false })),
        user: { activeCaseLoadId: 'MDI' },
      }),
    )
    expect($('.change-filters input[type="checkbox"]')).toHaveLength(6)
    expect($('.change-filters input:checked')).toHaveLength(0)
    expect($('.change-filters').attr('method')).toBe('GET')
    expect($('.change-filters input[name="page"]')).toHaveLength(0)
    expect($('.change-filters a').attr('href')).toBe('view-changes?date=2023-05-16')
  })

  it('retains applied filters and safely renders the search term in the empty state', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        date: '2023-05-16',
        changeEvents: [],
        searchTerm: '<Joe & Bob>',
        selectedFilters: ['alerts'],
        filterItems: changeFilters.map(({ value, text }) => ({ value, text, checked: value === 'alerts' })),
        user: { activeCaseLoadId: 'MDI' },
      }),
    )
    expect($('#searchTerm').val()).toBe('<Joe & Bob>')
    expect($('.change-filters input:checked').val()).toBe('alerts')
    expect($('[data-qa="no-data-p"]').text()).toContain('There are no changes matching your filters.')
  })
})
