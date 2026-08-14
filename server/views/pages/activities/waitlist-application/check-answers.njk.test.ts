import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/waitlist-application/check-answers.njk')

const getApplicationDetail = ($: CheerioAPI, heading: string) =>
  $(
    `[data-qa="waitlist-application-details"] > .govuk-summary-list__row > .govuk-summary-list__key:contains("${heading}")`,
  )
    .parent()
    .find('.govuk-summary-list__value')

const viewContext = (status: string) => ({
  prisoner: {
    name: 'Alan Key',
    prisonerNumber: 'ABC123',
  },
  activityName: 'Maths level 1',
  requestDate: '2026-08-12',
  requester: 'Self-requested',
  status,
})

describe('Views - Waitlist application - Check answers', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should display an approved application', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext('APPROVED')))

    expect(getApplicationDetail($, 'Status').text().trim()).toBe('Approved and on the waitlist')
  })

  it('should display a declined application as rejected', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext('DECLINED')))

    expect(getApplicationDetail($, 'Status').text().trim()).toBe('Rejected')
  })
})
