import * as cheerio from 'cheerio'
import fs from 'fs'
import { compile } from 'nunjucks'
import { registerNunjucks } from '../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/layout.njk')

describe('Layout', () => {
  it('renders the DPS header and footer without duplicate landmark wrappers', () => {
    const compiledTemplate = compile(view.toString(), registerNunjucks())
    const $ = cheerio.load(
      compiledTemplate.render({
        feComponents: {
          cssIncludes: [],
          jsIncludes: [],
          header: '<header class="dps-header"></header>',
          footer: '<footer class="dps-footer"></footer>',
        },
        liveIssueOutageBannerEnabled: false,
        plannedDowntimeOutageBannerEnabled: false,
        user: { username: 'joebloggs' },
      }),
    )

    expect($('header')).toHaveLength(1)
    expect($('footer')).toHaveLength(1)
    expect($('.govuk-template__header')).toHaveLength(0)
    expect($('.govuk-template__footer')).toHaveLength(0)
  })
})
