import * as cheerio from 'cheerio'
import { registerNunjucks } from '../nunjucks/nunjucksSetup'

describe('Template HTML escaping', () => {
  const env = registerNunjucks()
  const payload = '<img src=x onerror="alert(1)"> O\'Brien & Sons'

  it('passes tag manager configuration as escaped data rather than executable script', () => {
    const environment = '&gtm_auth=token&gtm_preview=env-1&test="</script><img src=x onerror=alert(1)>'
    const $ = cheerio.load(env.render('layout.njk', { tagManagerEnvironment: environment }))
    expect($('img')).toHaveLength(0)
    expect($('script[data-gtm-environment]').attr('data-gtm-environment')).toBe(environment)
    expect($('script[data-gtm-environment]').text()).not.toContain(environment)
  })

  it('escapes card headings and descriptions', () => {
    const $ = cheerio.load(
      env.renderString('{% from "components/card.njk" import card %}{{ card(options) }}', {
        options: { href: '/activities', heading: payload, description: payload },
      }),
    )
    expect($('.card img')).toHaveLength(0)
    expect($('.card__link').text()).toBe(payload)
    expect($('.card__description').text()).toBe(payload)
  })

  it('escapes non-association comments inside the table HTML', () => {
    const $ = cheerio.load(
      env.renderString(
        '{% from "partials/activities/nonAssociationsTable.njk" import nonAssociationsTable %}{{ nonAssociationsTable(rows, "Person") }}',
        {
          rows: [{ comments: payload, otherPrisonerDetails: {}, whenUpdated: '2026-09-22T12:00:00' }],
        },
      ),
    )
    expect($('table img')).toHaveLength(0)
    expect($('.naDetailsColumn').text()).toContain(payload)
  })

  it('escapes prisoner and activity names in a captured suspension heading', () => {
    const $ = cheerio.load(
      env.render('pages/activities/suspensions/pay.njk', {
        suspendJourney: { inmate: { prisonerName: payload }, allocations: [{ activityName: payload }] },
      }),
    )
    expect($('main img')).toHaveLength(0)
    expect($('h1').text()).toContain(`Should ${payload} be paid for ${payload}`)
  })

  it.each(['end-date', 'deallocate-today-option'])('escapes the captured %s heading once', page => {
    const $ = cheerio.load(
      env.render(`pages/activities/manage-allocations/${page}.njk`, {
        allocateJourney: {
          inmate: { prisonerName: payload },
          inmates: [{ prisonerName: payload }],
          activity: { name: payload },
        },
      }),
    )
    expect($('main img')).toHaveLength(0)
    expect($('h1').text()).toContain(payload)
    expect($('h1').text()).not.toContain('&lt;img')
  })

  it.each(['suspend', 'unsuspend'])('escapes the %s confirmation panel once', mode => {
    const $ = cheerio.load(
      env.render('pages/activities/suspensions/confirmation.njk', {
        now: '2026-09-22',
        session: { req: { routeContext: { mode } } },
        suspendJourney: {
          inmate: { prisonerName: payload, prisonerNumber: 'A1234BC' },
          allocations: [{ activityName: payload }],
          suspendFrom: '2026-09-22',
          suspendUntil: '2026-09-22',
        },
      }),
    )
    expect($('main img')).toHaveLength(0)
    expect($('.govuk-panel__body').text()).toContain(payload)
    expect($('.govuk-panel__body').text()).not.toContain('&lt;img')
  })

  it.each([true, false])('escapes alert descriptions with badge alerts set to %s', hasBadgeAlerts => {
    const $ = cheerio.load(
      env.render('pages/appointments/create-and-edit/review-prisoners-alerts.njk', {
        alertsDetails: {
          prisoners: [
            {
              number: 'A1234BC',
              name: 'Test Person',
              hasRelevantCategories: true,
              hasBadgeAlerts,
              alerts: [],
              alertDescriptions: [payload, 'Second alert'],
            },
          ],
        },
      }),
    )
    expect($('[data-qa="alert-descriptions"] img')).toHaveLength(0)
    expect($('[data-qa="alert-descriptions"] li')).toHaveLength(2)
    expect($('[data-qa="alert-descriptions"] li').first().text()).toBe(payload)
  })

  it('escapes the allocation heading, caption and radio labels', () => {
    const $ = cheerio.load(
      env.render('pages/activities/manage-allocations/addToSessionsToday.njk', {
        allocateJourney: { activity: { name: payload } },
        headingText: payload,
        yesText: payload,
        noText: payload,
      }),
    )
    expect($('main img')).toHaveLength(0)
    expect($('h1').text()).toBe(payload)
    expect($('.govuk-caption-xl').text()).toBe(payload)
    expect($('.govuk-radios__label').first().text().trim()).toBe(payload)
  })

  it('preserves session inset line breaks while escaping dynamic text', () => {
    const $ = cheerio.load(
      env.render('pages/activities/create-an-activity/run-session-today.njk', {
        createJourney: { name: payload },
        headingText: payload,
        yesText: payload,
        noText: payload,
        insetText: `${payload}<br>Later session`,
      }),
    )
    expect($('main img')).toHaveLength(0)
    expect($('.govuk-inset-text br')).toHaveLength(1)
    expect($('.govuk-inset-text').text()).toContain(payload)
    expect($('h1').text()).toBe(payload)
    expect($('.govuk-radios__label').last().text().trim()).toBe(payload)
  })

  it('preserves movement slip markup while escaping appointment data', () => {
    const $ = cheerio.load(
      env.renderString(
        '{% from "pages/appointments/partials/appointment-movement-slip.njk" import appointmentMovementSlip %}{{ appointmentMovementSlip(appointment, "Prison", printedAt) }}',
        {
          printedAt: new Date('2026-09-22T12:00:00Z'),
          appointment: {
            appointmentName: payload,
            extraInformation: payload,
            internalLocation: { description: payload },
            startDate: '2026-09-22',
            startTime: payload,
            endTime: '14:00',
            category: { code: 'MEOT' },
            attendees: [{ prisoner: { prisonerNumber: 'A1234BC' } }],
          },
        },
      ),
    )
    expect($('.movement-slip img')).toHaveLength(0)
    expect($('[data-qa="appointment"]').text()).toBe(payload)
    expect($('[data-qa="extra-information"]').text()).toBe(payload)
    expect($('[data-qa="location"]').text().trim()).toBe(payload)
    expect($('[data-qa="time"] li')).toHaveLength(2)
    expect($('[data-qa="time"] li').first().text()).toContain(payload)
  })
})
