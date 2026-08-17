import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/manage-allocations/before-you-allocate.njk')

describe('Views - Manage Allocations - Before you allocate', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  const baseContext = {
    allocateJourney: {
      inmate: {
        prisonerName: 'Alfonso Cholak',
        prisonerNumber: 'A5015DY',
      },
      activity: {
        activityId: 2,
        name: 'English level 1',
      },
    },
    allocationSuitability: {
      previousDeallocations: [],
      workplaceRiskAssessment: {
        riskLevel: 'medium',
        suitable: true,
      },
      incentiveLevel: {
        incentiveLevel: 'Standard',
        suitable: true,
      },
      education: {
        education: null,
        suitable: true,
      },
      releaseDate: {
        earliestReleaseDate: null,
        suitable: true,
      },
      allocations: [],
    },
    user: {
      activeCaseLoad: {
        description: 'Moorland (HMP)',
      },
    },
    validationErrors: [],
    dpsUrl: '',
  }

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should show open non-associations and a link to review them', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        ...baseContext,
        nonAssociations: [{}, {}],
      }),
    )

    expect($('[data-qa="non-association-count-para"]').text().replace(/\s+/g, ' ').trim()).toBe(
      'Review Alfonso Cholak’s 2 open non-associations in Moorland (HMP) to check that they can be safely allocated.',
    )

    const link = $('[data-qa="non-association-link"]')

    expect(link.text().trim()).toBe('View Alfonso Cholak’s non-associations')
    expect(link.attr('href')).toBe('/activities/non-associations/2/A5015DY')
  })

  it('should show when the prisoner has no open non-associations', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        ...baseContext,
        nonAssociations: [],
      }),
    )

    expect($('[data-qa="non-association-count-para"]')).toHaveLength(0)
    expect($('[data-qa="non-association-link"]')).toHaveLength(0)

    expect($('[data-qa="no-non-associations-para"]').text().trim()).toBe(
      'Alfonso Cholak has no open non-associations with anyone in Moorland (HMP).',
    )
  })

  it('should show a single open non-association', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        ...baseContext,
        nonAssociations: [{}],
      }),
    )

    expect($('[data-qa="non-association-count-para"]').text().replace(/\s+/g, ' ').trim()).toBe(
      'Review Alfonso Cholak’s one open non-association in Moorland (HMP) to check that they can be safely allocated.',
    )

    expect($('[data-qa="non-association-link"]')).toHaveLength(1)
  })
})
