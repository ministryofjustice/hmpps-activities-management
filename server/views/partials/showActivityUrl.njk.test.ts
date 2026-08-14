import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import { registerNunjucks } from '../../nunjucks/nunjucksSetup'

describe('Show activity URL', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    const view = `
      {% from "partials/showActivityUrl.njk" import showActivityUrl %}
      {{ showActivityUrl(activity, user) }}
    `

    compiledTemplate = compile(view, njkEnv)
  })

  it('should display the activity as a link for an Activity Hub user', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        activity: {
          id: 1,
          activityName: 'Maths level 1',
        },
        user: {
          roles: ['ROLE_ACTIVITY_HUB'],
        },
      }),
    )

    const activityLink = $('[data-qa="activity-waitlist-link"]')

    expect(activityLink).toHaveLength(1)
    expect(activityLink.text().trim()).toBe('Maths level 1')
    expect(activityLink.attr('href')).toBe('/activities/allocation-dashboard/1#waitlist-tab')
    expect(activityLink.attr('target')).toBe('_blank')
  })

  it('should display the activity as plain text for a non-Activity Hub user', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        activity: {
          id: 1,
          activityName: 'Maths level 1',
        },
        user: {
          roles: [],
        },
      }),
    )

    expect($('[data-qa="activity-waitlist-link"]')).toHaveLength(0)
    expect($('body').text().trim()).toBe('Maths level 1')
  })

  it('should display the activity as plain text when it does not have an id', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        activity: {
          activityName: 'Maths level 1',
        },
        user: {
          roles: ['ROLE_ACTIVITY_HUB'],
        },
      }),
    )

    expect($('[data-qa="activity-waitlist-link"]')).toHaveLength(0)
    expect($('body').text().trim()).toBe('Maths level 1')
  })
})
