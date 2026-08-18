import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import { registerNunjucks } from '../../nunjucks/nunjucksSetup'

describe('Views - Mini profile', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(
      `
        {% from "partials/miniProfile.njk" import miniProfile %}
        {{ miniProfile(prisoner) }}
      `,
      njkEnv,
    )
  })

  it('should render prisoner details and links', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        prisoner: {
          prisonerNumber: 'G0995GW',
          firstName: 'Aeticake',
          lastName: 'Potta',
          location: 'A-N-3-30N',
          currentIncentive: {
            level: {
              description: 'Standard',
            },
          },
          earliestReleaseDate: '2019-11-30',
          workplaceRiskAssessment: 'NONE',
        },
        prisonerUrl: 'https://prisoner-dev.digital.prison.service.justice.gov.uk',
        incentivesUrl: 'https://incentives-ui-dev.hmpps.service.justice.gov.uk',
      }),
    )

    const details = $('.mini-profile__detail')

    const valueFor = (label: string) =>
      details
        .filter((_, detail) => $(detail).find('.mini-profile__detail-label').text().trim() === label)
        .find('.mini-profile__detail-value')

    expect($('.mini-profile__detail-label').first().text().trim()).toBe('Aeticake Potta')

    expect(valueFor('Location').text().trim()).toBe('A-N-3-30N')
    expect(valueFor('Incentive level').text().trim()).toBe('Standard')
    expect(valueFor('Earliest release date').text().trim()).toBe('30 November 2019')
    expect(valueFor('Workplace risk assessment').text().trim()).toBe('None')

    expect(valueFor('Location').find('a').attr('href')).toBe(
      'https://prisoner-dev.digital.prison.service.justice.gov.uk/prisoner/G0995GW/location-details',
    )

    expect(valueFor('Incentive level').find('a').attr('href')).toBe(
      'https://incentives-ui-dev.hmpps.service.justice.gov.uk/incentive-reviews/prisoner/G0995GW',
    )

    expect(valueFor('Earliest release date').find('a').attr('href')).toBe(
      'https://prisoner-dev.digital.prison.service.justice.gov.uk/prisoner/G0995GW/offences#release-dates',
    )

    expect($('[data-qa="offender-image"]').attr('src')).toBe('/profileImage/G0995GW/image')
    expect($('[data-qa="offender-image"]').attr('alt')).toBe('Photograph of Aeticake Potta')
  })
})
