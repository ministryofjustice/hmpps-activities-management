import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/suspensions/confirmation.njk')

describe('Views - Suspensions - Confirmation', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()
  const now = '2026-08-24'

  const render = ({
    mode = 'suspend',
    outsideWork = false,
    externalActivitiesRolledOut = false,
    suspendFrom = now,
    suspendUntil = now,
  }: {
    mode?: 'suspend' | 'unsuspend'
    outsideWork?: boolean
    externalActivitiesRolledOut?: boolean
    suspendFrom?: string
    suspendUntil?: string
  } = {}) =>
    cheerio.load(
      compiledTemplate.render({
        now,
        user: {
          externalActivitiesRolledOut,
        },
        session: {
          req: {
            routeContext: {
              mode,
            },
          },
          suspendJourney: {
            inmate: {
              prisonerName: 'Alfonso Cholak',
              prisonerNumber: 'G0995GW',
            },
            allocations: [
              {
                allocationId: 1,
                activityId: 14,
                activityName: 'Hotel',
                outsideWork,
              },
            ],
            paid: 'YES',
            suspendFrom,
            suspendUntil,
          },
        },
      }),
    )

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('shows standard guidance when an in-prison suspension starts immediately', () => {
    const $ = render()

    expect($('.govuk-panel__title').text().trim()).toBe('Suspension started')

    expect($('.govuk-panel__body').text()).toContain('Alfonso Cholak (G0995GW) is now suspended from')

    expect($('main').text()).toContain(
      'Unlock and movement lists for today may need to be printed again to show this suspension.',
    )

    expect($('main').text()).not.toContain('Temporary absences')
  })

  it('shows external activity guidance when an outside suspension starts immediately', () => {
    const $ = render({
      outsideWork: true,
      externalActivitiesRolledOut: true,
    })

    expect($('.govuk-panel__title').text().trim()).toBe('Suspension started')

    expect($('main').text()).toContain(
      'Temporary absences for Alfonso Cholak to go out to this activity should be cancelled.',
    )

    expect($('main').text()).toContain('Unlock and movement lists for today may need to be printed again.')
  })

  it('shows future external activity guidance when an outside suspension starts later', () => {
    const $ = render({
      outsideWork: true,
      externalActivitiesRolledOut: true,
      suspendFrom: '2026-08-25',
    })

    expect($('.govuk-panel__title').text().trim()).toBe('Suspension added')

    expect($('.govuk-panel__body').text()).toContain('25 August 2026')

    expect($('main').text()).toContain(
      'Temporary absences for Alfonso Cholak to go out to this activity should be cancelled.',
    )

    expect($('main').text()).not.toContain('Unlock and movement lists for today may need to be printed again.')
  })

  it('shows the immediate end of suspension confirmation', () => {
    const $ = render({
      mode: 'unsuspend',
    })

    expect($('.govuk-panel__title').text().trim()).toBe('Suspension ended')

    expect($('.govuk-panel__body').text()).toContain('Alfonso Cholak (G0995GW) is no longer suspended from')

    expect($('.govuk-warning-text').text()).toContain(
      "Unlock and movement lists may need to be printed again if they're due to attend this activity later today.",
    )
  })

  it('shows when a suspension is set to end on a future date', () => {
    const $ = render({
      mode: 'unsuspend',
      suspendUntil: '2026-08-27',
    })

    expect($('.govuk-panel__title').text().trim()).toBe('Suspension set to end')

    expect($('.govuk-panel__body').text()).toContain('Alfonso Cholak (G0995GW) will be due to attend')

    expect($('.govuk-panel__body').text()).toContain('Hotel again')

    expect($('.govuk-panel__body').text()).toContain('27 August 2026')

    expect($('.govuk-warning-text')).toHaveLength(0)
  })
})
