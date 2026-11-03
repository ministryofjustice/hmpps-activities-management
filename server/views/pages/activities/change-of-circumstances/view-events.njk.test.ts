import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { changeFilters } from '../../../../routes/activities/change-of-circumstances/handlers/changeFilters'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const snippet = fs.readFileSync('server/views/pages/activities/change-of-circumstances/view-events.njk')
const context = {
  date: '2023-05-16',
  page: 0,
  reviewed: false,
  hasFilters: false,
  changesToReviewHref: 'view-changes?date=2023-05-16',
  reviewedChangesHref: 'view-changes?date=2023-05-16&reviewed=true',
  changeEvents: [],
  selectedFilters: [],
  filterItems: changeFilters.map(({ value, text }) => ({ value, text, checked: false })),
  clearFiltersHref: 'view-changes?date=2023-05-16',
  user: { activeCaseLoadId: 'MDI' },
}
const event = {
  eventReviewId: 1,
  prisonerNumber: 'A1234AA',
  firstName: 'MARTIN',
  lastName: 'SMITH',
  prisonerPrisonCode: 'MDI',
  prisonerStatus: 'ACTIVE IN',
  cellLocation: 'A-1-001',
  eventType: 'prison-offender-events.prisoner.cell.move',
  eventData: 'Cell move',
  eventTime: '2023-05-16T08:32:00',
  acknowledgedBy: null,
  activeAllocations: ['Kitchen AM', 'Maths PM'],
}
const normaliseText = (value: string) => value.replace(/\s+/g, ' ').trim()

describe('Views - Changes in circumstances', () => {
  let template: Template
  beforeEach(() => {
    template = compile(snippet.toString(), registerNunjucks())
  })

  it('renders the heading, selected date and introductory text', () => {
    const $ = cheerio.load(template.render(context))
    expect($('h1').text()).toBe('Changes to review')
    expect($('h1').hasClass('govuk-heading-l')).toBe(true)
    expect($('.govuk-caption-m').first().text()).toBe('Review changes in circumstances')
    expect($('.govuk-caption-m').last().text()).toBe('Tuesday, 16 May 2023')
    expect($('main').text()).toContain('Review changes that may affect people’s allocations.')
  })

  it.each([
    [false, false, 'There are no changes to review. Select a different date.'],
    [false, true, 'There are no changes to review. Change your filter or search, or select a different date.'],
    [true, false, 'No changes have been reviewed.'],
    [true, true, 'No changes have been reviewed. Change your filter or search options.'],
  ])('shows the correct empty state for reviewed=%s, filtered=%s', (reviewed, hasFilters, expected) => {
    const $ = cheerio.load(template.render({ ...context, reviewed, hasFilters }))
    expect(normaliseText($('[data-qa="no-data-p"]').text())).toBe(expected)
    expect($('table')).toHaveLength(0)
    if (!reviewed)
      expect($('[data-qa="no-data-link"]').attr('href')).toBe('/activities/change-of-circumstances/select-period')
  })

  it.each([false, true])('marks only the current tab active when reviewed=%s', reviewed => {
    const $ = cheerio.load(template.render({ ...context, reviewed }))
    const active = $('.moj-sub-navigation a[aria-current="page"]')
    expect(active).toHaveLength(1)
    expect(active.text()).toBe(reviewed ? 'Changes that have been reviewed' : 'Changes to review')
  })

  it('shows checkboxes, sortable columns, allocations, and accessible action text for outstanding changes', () => {
    const $ = cheerio.load(template.render({ ...context, changeEvents: [event] }))
    expect($('tbody input[name="selectedEvents"]')).toHaveLength(1)
    expect($('tbody input').val()).toBe('1')
    expect($('th[aria-sort="ascending"]').text().trim()).toBe('Time')
    expect(
      $('th[aria-sort="none"]')
        .map((_, element) => $(element).text().trim())
        .get(),
    ).toEqual(['Prisoner', 'Change'])
    expect($('th:not([aria-sort])').text()).toContain('Details')
    expect($('th:not([aria-sort])').text()).toContain('Allocations')
    expect($('td[data-sort-value="Cell move"]')).toHaveLength(1)
    expect(normaliseText($('tbody').text())).toContain('08:32')
    expect(normaliseText($('tbody').text())).toContain('A-1-001')
    expect(normaliseText($('tbody').text())).toContain('Kitchen AM')
    const action = $('a[href="/activities/prisoner-allocations/A1234AA"]')
    expect(normaliseText(action.text())).toBe('Manage allocations for Martin Smith')
    expect(action.find('.govuk-visually-hidden').text().trim()).toBe('for Martin Smith')
  })

  it('shows the read-only reviewed table with a non-sortable reviewer column and no checkboxes', () => {
    const $ = cheerio.load(
      template.render({ ...context, reviewed: true, changeEvents: [{ ...event, acknowledgedBy: 'REVIEWER1' }] }),
    )
    expect($('tbody input[type="checkbox"]')).toHaveLength(0)
    expect($('form[method="POST"]')).toHaveLength(0)
    expect(
      $('th')
        .filter((_, element) => $(element).text().trim() === 'Reviewed by')
        .attr('aria-sort'),
    ).toBeUndefined()
    expect($('tbody').text()).toContain('REVIEWER1')
    expect($('table').attr('data-module')).toBe('moj-sortable-table')
  })

  it('renders event data and allocations as text rather than HTML', () => {
    const $ = cheerio.load(
      template.render({
        ...context,
        changeEvents: [
          { ...event, eventData: '<script>bad()</script>', activeAllocations: ['<script>bad()</script>'] },
        ],
      }),
    )
    expect($('tbody script')).toHaveLength(0)
    expect($('tbody').text()).toContain('<script>bad()</script>')
  })
  it('renders all six filters unselected by default and Clear retains only the date', () => {
    const $ = cheerio.load(
      template.render({
        ...context,
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
      template.render({
        ...context,
        date: '2023-05-16',
        changeEvents: [],
        hasFilters: true,
        searchTerm: '<Joe & Bob>',
        selectedFilters: ['alerts'],
        filterItems: changeFilters.map(({ value, text }) => ({ value, text, checked: value === 'alerts' })),
        user: { activeCaseLoadId: 'MDI' },
      }),
    )
    expect($('#searchTerm').val()).toBe('<Joe & Bob>')
    expect($('.change-filters input:checked').val()).toBe('alerts')
    expect($('[data-qa="no-data-p"]').text()).toContain('There are no changes to review.')
  })
  it('keeps Apply and Clear on the reviewed tab without showing row selection checkboxes', () => {
    const $ = cheerio.load(
      template.render({
        ...context,
        reviewed: true,
        hasFilters: true,
        searchTerm: 'Smith',
        selectedFilters: ['cell-moves'],
        filterItems: changeFilters.map(({ value, text }) => ({ value, text, checked: value === 'cell-moves' })),
        clearFiltersHref: 'view-changes?date=2023-05-16&reviewed=true',
        changeEvents: [{ ...event, acknowledgedBy: 'REVIEWER1' }],
      }),
    )
    expect($('.change-filters input[name="reviewed"]').val()).toBe('true')
    expect($('.change-filters a').attr('href')).toBe('view-changes?date=2023-05-16&reviewed=true')
    expect($('tbody input[type="checkbox"]')).toHaveLength(0)
    expect($('.change-filters input:checked').val()).toBe('cell-moves')
  })

  it('preserves the applied filters in the mark-as-reviewed form', () => {
    const $ = cheerio.load(
      template.render({
        ...context,
        searchTerm: 'Smith',
        selectedFilters: ['alerts', 'cell-moves'],
        changeEvents: [event],
      }),
    )
    const form = $('form[method="POST"]')
    expect(form.find('input[name="searchTerm"]').val()).toBe('Smith')
    expect(
      form
        .find('input[name="changeTypes"]')
        .map((_, element) => $(element).val())
        .get(),
    ).toEqual(['alerts', 'cell-moves'])
  })
  it.each([
    [1, 10, 50],
    [11, 20, 50],
    [1, 3, 3],
    [1, 1, 1],
  ])('shows the range %s–%s of %s changes above and below the table', (from, to, count) => {
    const $ = cheerio.load(
      template.render({
        ...context,
        changeEvents: [event],
        pagination: {
          items:
            count > 10
              ? [
                  { text: '1', href: '?page=0' },
                  { text: '2', href: '?page=1' },
                ]
              : [],
          results: { from, to, count },
        },
      }),
    )
    const summaries = $('.moj-pagination__results')
      .map((_, element) => $(element).text().trim())
      .get()
    expect(summaries).toEqual(
      Array(2).fill(`Showing ${from} to ${to} of ${count} ${count === 1 ? 'change' : 'changes'}`),
    )
    expect($('.moj-pagination nav.govuk-pagination')).toHaveLength(count > 10 ? 2 : 0)
  })
})
