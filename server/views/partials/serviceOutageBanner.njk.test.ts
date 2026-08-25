import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import { compile, Template } from 'nunjucks'
import { registerNunjucks } from '../../nunjucks/nunjucksSetup'

let $: CheerioAPI

describe('service outage banner', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile('{% include "partials/serviceOutageBanner.njk" %}', njkEnv)
  })

  it('shows the live issue outage message', () => {
    $ = cheerio.load(
      compiledTemplate.render({
        liveIssueOutageBannerEnabled: true,
        plannedDowntimeOutageBannerEnabled: false,
      }),
    )

    const banner = $('[data-qa="outage-banner"]')

    expect(banner).toHaveLength(1)
    expect(banner.text()).toContain('Problems with the Activities service')
    expect(banner.text()).toContain(
      'We’re aware of problems with this service. We’re working on fixing them, but you may need to try again later.',
    )
  })

  it('shows the planned downtime outage message', () => {
    $ = cheerio.load(
      compiledTemplate.render({
        liveIssueOutageBannerEnabled: false,
        plannedDowntimeOutageBannerEnabled: true,
        plannedDowntimeDate: Date.parse('2025-05-20'),
        plannedDowntimeStartTime: '9am',
        plannedDowntimeEndTime: '11am',
      }),
    )

    const banner = $('[data-qa="outage-banner"]')

    expect(banner).toHaveLength(1)
    expect(banner.text()).toContain('Important')
    expect(banner.text()).toContain(
      'The Activities service will be unavailable on Tuesday, 20 May 2025 between 9am and 11am.',
    )
  })
})
