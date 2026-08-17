import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync(
  'server/views/pages/activities/manage-allocations/allocateMultiplePeople/reviewUploadPrisonerList.njk',
)

describe('Views - Review uploaded prisoner list', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should render eligible and ineligible people when copying from another activity', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        allocateJourney: {
          activity: {
            activityId: 2,
            name: 'Entry level English 1',
          },
          notFoundPrisoners: [],
        },
        unallocatedInmates: [
          {
            firstName: 'Robert',
            middleNames: 'Bob',
            lastName: 'Ramroop',
            prisonerNumber: 'G4793VF',
            cellLocation: '2-2-024',
            prisonCode: 'MDI',
            status: 'ACTIVE IN',
            nonAssociations: true,
            otherAllocations: [
              {
                activityId: 1,
                activitySummary: 'Maths level 1',
              },
              {
                activityId: 2,
                activitySummary: 'English level 1',
              },
            ],
          },
        ],
        allocatedInmates: [
          {
            firstName: 'Some',
            middleNames: 'Body',
            lastName: 'Somewhere',
            prisonerNumber: 'A1351DZ',
            startDate: '2022-10-10',
          },
        ],
        withoutMatchingIncentiveLevelInmates: [
          {
            firstName: 'Bumahwaju Peter',
            lastName: 'Alfres',
            prisonerNumber: 'B1351RE',
            incentiveLevel: 'Enhanced2',
          },
        ],
        cannotAllocateMessage:
          '2 people from A basic maths course suitable for introduction to the subject cannot be allocated to Entry level English 1',
        csv: false,
        preserveHistory: false,
        user: {
          activeCaseLoadId: 'MDI',
        },
        dpsUrl: '',
      }),
    )

    expect($('.govuk-caption-l').text().trim()).toBe('Entry level English 1')

    expect($('[data-qa="inmate-list"] tbody tr')).toHaveLength(1)

    const inmateRow = $('[data-qa="inmate-list"] tbody tr').text().replace(/\s+/g, ' ').trim()

    expect(inmateRow).toContain('Ramroop, Robert Bob')
    expect(inmateRow).toContain('2-2-024')
    expect(inmateRow).toContain('View non-associations')
    expect(inmateRow).toContain('Maths level 1')
    expect(inmateRow).toContain('English level 1')
    expect(inmateRow).toContain('Remove')

    expect($('[data-qa="incentive-level-list"] tbody tr')).toHaveLength(1)
    expect($('[data-qa="incentive-level-list"]').text()).toContain('Alfres, Bumahwaju Peter')
    expect($('[data-qa="incentive-level-list"]').text()).toContain('Enhanced2')

    expect($('[data-qa="allocated-inmate-list"] tbody tr')).toHaveLength(1)
    expect($('[data-qa="allocated-inmate-list"]').text()).toContain('Somewhere, Some Body')
    expect($('[data-qa="allocated-inmate-start-date"]').text()).toContain('10 October 2022')

    expect($('[data-qa="cannot-allocate-title"]').text().replace(/\s+/g, ' ').trim()).toBe(
      '2 people from A basic maths course suitable for introduction to the subject cannot be allocated to Entry level English 1',
    )

    expect($('[data-qa="incentive-level-text"]').text().replace(/\s+/g, ' ').trim()).toContain(
      'There is 1 person with an incentive level that does not match a pay rate for this activity.',
    )

    expect($('[data-qa="already-allocated-text"]').text().replace(/\s+/g, ' ').trim()).toBe(
      'There is 1 person already allocated to Entry level English 1',
    )
  })

  it('should render the blocked state when nobody from the selected activity can be allocated', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        allocateJourney: {
          activity: {
            activityId: 2,
            name: 'Entry level English 1',
          },
          notFoundPrisoners: [],
        },
        unallocatedInmates: [],
        allocatedInmates: [
          {
            firstName: 'Robert',
            middleNames: 'Bob',
            lastName: 'Ramroop',
            prisonerNumber: 'G4793VF',
            startDate: '2022-10-10',
          },
          {
            firstName: 'Some',
            middleNames: 'Body',
            lastName: 'Somewhere',
            prisonerNumber: 'A1351DZ',
            startDate: '2022-10-10',
          },
        ],
        withoutMatchingIncentiveLevelInmates: [
          {
            firstName: 'Bumahwaju Peter',
            lastName: 'Alfres',
            prisonerNumber: 'B1351RE',
            incentiveLevel: 'Enhanced2',
          },
        ],
        nobodyToAllocateTitle:
          'No-one from A basic maths course suitable for introduction to the subject can be allocated',
        csv: false,
        preserveHistory: false,
        user: {
          activeCaseLoadId: 'MDI',
        },
        dpsUrl: '',
      }),
    )

    expect($('.govuk-caption-l').text().trim()).toBe('Entry level English 1')

    expect($('h1.govuk-heading-l').text().trim()).toBe(
      'No-one from A basic maths course suitable for introduction to the subject can be allocated',
    )

    expect($('[data-qa="inmate-list"]')).toHaveLength(0)

    expect($('[data-qa="cannot-allocate-title"]').text().trim()).toBe('Why people could not be allocated')

    const pageText = $('main').text().replace(/\s+/g, ' ').trim()

    expect(pageText).toContain('Check the list of people you’re using is correct. You may need to:')
    expect(pageText).toContain('select a different activity')
    expect(pageText).toContain('edit people’s allocations')
    expect(pageText).toContain('change activity requirements')

    expect($('[data-qa="incentive-level-list"] tbody tr')).toHaveLength(1)
    expect($('[data-qa="incentive-level-list"]').text()).toContain('Alfres, Bumahwaju Peter')

    expect($('[data-qa="allocated-inmate-list"] tbody tr')).toHaveLength(2)
    expect($('[data-qa="allocated-inmate-list"]').text()).toContain('Ramroop, Robert Bob')
    expect($('[data-qa="allocated-inmate-list"]').text()).toContain('Somewhere, Some Body')

    expect($('[data-qa="already-allocated-text"]').text().replace(/\s+/g, ' ').trim()).toBe(
      'There are 2 people already allocated to Entry level English 1',
    )

    const returnLink = $('a.govuk-button')

    expect(returnLink.text().trim()).toBe('Return to the activity')
    expect(returnLink.attr('href')).toBe('/activities/allocation-dashboard/2')
  })
})
