import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const snippet = fs.readFileSync('server/views/pages/activities/allocation-dashboard/allocation-dashboard.njk')

describe('Views - Allocation dashboard', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(snippet.toString(), njkEnv)
  })

  it('should generate the incentive levels filter dropdown correctly', () => {
    viewContext = {
      suitableForIep: 'Basic, Enhanced',
      incentiveLevels: [
        { levelName: 'Basic' },
        { levelName: 'Standard' },
        { levelName: 'Enhanced' },
        { levelName: 'Enhanced 2' },
        { levelName: 'Enhanced 3' },
      ],
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(
      $('#candidates-filter > .govuk-form-group > #incentiveLevelFilter > option')
        .map((i, e) => $(e).text())
        .get(),
    ).toEqual([
      'Any suitable incentive level',
      'Basic',
      'Standard',
      'Enhanced',
      'Enhanced 2',
      'Enhanced 3',
      'All incentive levels',
    ])
  })
})
