import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import { compile, Template } from 'nunjucks'
import { registerNunjucks } from '../../../nunjucks/nunjucksSetup'

let $: CheerioAPI

describe('Activity Type Filters Macro', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    const view = `
      {% from "partials/attendance/activityTypeFilters.njk" import activityTypeFilters %}

      {{ activityTypeFilters(selectedActivityTypes, externalActivitiesRolledOut) }}
    `

    compiledTemplate = compile(view, njkEnv)
  })

  it('should render activity type checkboxes when external activities are enabled', () => {
    $ = cheerio.load(
      compiledTemplate.render({
        selectedActivityTypes: [],
        externalActivitiesRolledOut: true,
      }),
    )

    expect($('input[name="activityTypeFilters"][value="inPrison"]')).toHaveLength(1)

    expect($('input[name="activityTypeFilters"][value="outsidePrison"]')).toHaveLength(1)

    expect($('input[name="activityTypeFilters"][value="outsideEmployer"]')).toHaveLength(1)
  })

  it('should not render activity type checkboxes when external activities are disabled', () => {
    $ = cheerio.load(
      compiledTemplate.render({
        selectedActivityTypes: [],
        externalActivitiesRolledOut: false,
      }),
    )

    expect($('input[name="activityTypeFilters"]')).toHaveLength(0)
  })

  it('should preserve selected activity type filters', () => {
    $ = cheerio.load(
      compiledTemplate.render({
        selectedActivityTypes: ['outsidePrison', 'outsideEmployer'],
        externalActivitiesRolledOut: true,
      }),
    )

    expect($('input[name="activityTypeFilters"][value="inPrison"]').is(':checked')).toBe(false)

    expect($('input[name="activityTypeFilters"][value="outsidePrison"]').is(':checked')).toBe(true)

    expect($('input[name="activityTypeFilters"][value="outsideEmployer"]').is(':checked')).toBe(true)
  })
})
