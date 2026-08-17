import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { WaitingListAllocationStatusOptions } from '../../../../enum/waitingListStatus'

const snippet = fs.readFileSync('server/views/pages/activities/allocation-dashboard/allocation-dashboard.njk')

describe('Views - Allocation dashboard', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(snippet.toString(), njkEnv)
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
      user: {
        externalActivitiesRolledOut: false,
      },
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

  it('should generate the waitlist status filter correctly', () => {
    viewContext = {
      suitableForIep: 'All Incentive Levels',
      incentiveLevels: [],
      filters: {
        waitlistStatusFilter: 'Any',
      },
      WaitingListAllocationStatusOptions,
      waitlistedPrisoners: [],
      activity: {
        outsideWork: false,
      },
      schedule: {
        description: 'English level 1',
      },
      user: {
        externalActivitiesRolledOut: false,
      },
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    const options = $('#waitlistStatusFilter option')

    expect(options.map((i, option) => $(option).attr('value')).get()).toEqual([
      'Any',
      'APPROVED',
      'PENDING',
      'DECLINED',
      'WITHDRAWN',
    ])

    expect(options.map((i, option) => $(option).text().trim()).get()).toEqual([
      'Any',
      'Approved and on the waitlist',
      'Pending',
      'Rejected',
      'Withdrawn',
    ])
  })
})
