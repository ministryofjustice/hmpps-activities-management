import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
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
const text = (value: string) => value.replace(/\s+/g, ' ').trim()

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
    expect(text($('[data-qa="no-data-p"]').text())).toBe(expected)
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
    expect(text($('tbody').text())).toContain('08:32')
    expect(text($('tbody').text())).toContain('A-1-001')
    expect(text($('tbody').text())).toContain('Kitchen AM')
    const action = $('a[href="/activities/prisoner-allocations/A1234AA"]')
    expect(text(action.text())).toBe('Manage allocations for Martin Smith')
    expect(action.find('.govuk-visually-hidden').text().trim()).toBe('for Martin Smith')
  })

  it('shows the read-only reviewed table with a non-sortable reviewer column and no checkboxes', () => {
    const $ = cheerio.load(
      template.render({ ...context, reviewed: true, changeEvents: [{ ...event, acknowledgedBy: 'REVIEWER1' }] }),
    )
    expect($('input[type="checkbox"]')).toHaveLength(0)
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
})
