import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
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
})
