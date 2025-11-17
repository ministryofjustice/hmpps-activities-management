import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync(
  'server/views/pages/activities/manage-allocations/allocateMultiplePeople/activityRequirementsReview.njk',
)

describe('Views - Activity Requirements Review', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('activity requirements review for one person', () => {
    viewContext = {
      prisoners: [
        {
          workplaceRiskAssessment: {
            riskLevel: 'low',
            suitable: true,
          },
          education: {
            education: null,
            suitable: true,
          },
        },
      ],
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text().trim()).toEqual('Review 1 person who does not meet activity requirements')
  })

  it('activity requirements review for more than one person', () => {
    viewContext = {
      prisoners: [
        {
          workplaceRiskAssessment: {
            riskLevel: 'low',
            suitable: true,
          },
          education: {
            education: null,
            suitable: true,
          },
        },
        {
          workplaceRiskAssessment: {
            riskLevel: 'none',
            suitable: true,
          },
          education: {
            education: null,
            suitable: true,
          },
        },
      ],
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text().trim()).toEqual('Review 2 people who do not meet activity requirements')
  })
})
