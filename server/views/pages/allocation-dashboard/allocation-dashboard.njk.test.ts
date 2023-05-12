import cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../nunjucks/nunjucksSetup'

const snippet = fs.readFileSync('server/views/pages/allocation-dashboard/allocation-dashboard.njk')

describe('Views - Allocation dashboard', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(snippet.toString(), njkEnv)
  })

  it('should generate the incentive levels filter dropdown correctly', () => {
    viewContext = {
      incentiveLevels: [
        { iepDescription: 'Basic' },
        { iepDescription: 'Standard' },
        { iepDescription: 'Enhanced' },
        { iepDescription: 'Enhanced 2' },
        { iepDescription: 'Enhanced 3' },
      ],
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(
      $('#incentiveLevelFilter > option')
        .map((i, e) => $(e).text())
        .get(),
    ).toEqual([
      'All Incentive Levels',
      'Basic',
      'Standard',
      'Enhanced',
      'Enhanced 2',
      'Enhanced 3',
      'Basic or Standard',
      'Basic or Standard or Enhanced',
      'Basic or Standard or Enhanced or Enhanced 2',
      'Enhanced 2 or Enhanced 3',
      'Enhanced or Enhanced 2 or Enhanced 3',
      'Standard or Enhanced or Enhanced 2 or Enhanced 3',
    ])
  })
})
