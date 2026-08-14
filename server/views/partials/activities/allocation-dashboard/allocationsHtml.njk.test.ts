import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

describe('Views - Prisoner allocation dashboard - allocations', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    const view = `
      {% from "govuk/components/button/macro.njk" import govukButton %}
      {% from "govuk/components/table/macro.njk" import govukTable %}
      {% include "partials/activities/allocation-dashboard/allocationsHtml.njk" %}
    `

    compiledTemplate = compile(view, njkEnv)
  })

  const baseContext = {
    prisoner: {
      prisonerNumber: 'A1234BC',
      firstName: 'Joe',
      lastName: 'Bloggs',
    },
    session: {
      req: {
        params: {
          prisonerNumber: 'A1234BC',
        },
      },
    },
    allocationsData: [],
    activeAllocationIdsForSuspending: [],
    prisonerUrl: '',
  }

  it.each([
    ['approved', [{ id: 1 }], []],
    ['pending', [], [{ id: 2 }]],
  ])(
    'should link to waitlist allocation when the prisoner has a %s application',
    (_, approvedApplications, pendingApplications) => {
      const $ = cheerio.load(
        compiledTemplate.render({
          ...baseContext,
          approvedApplications,
          pendingApplications,
        }),
      )

      const allocateButton = $('a.govuk-button').filter(
        (_, element) => $(element).text().trim() === 'Allocate to an activity',
      )

      expect(allocateButton.attr('href')).toBe('/activities/prisoner-allocations/allocate/A1234BC/waitlist-allocation')
    },
  )

  it('should link to activity search when the prisoner has no approved or pending applications', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        ...baseContext,
        approvedApplications: [],
        pendingApplications: [],
      }),
    )

    const allocateButton = $('a.govuk-button').filter(
      (_, element) => $(element).text().trim() === 'Allocate to an activity',
    )

    expect(allocateButton.attr('href')).toBe('/activities/prisoner-allocations/A1234BC/select-activity')
  })
})
