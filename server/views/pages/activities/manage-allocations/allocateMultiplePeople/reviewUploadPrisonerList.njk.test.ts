import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync(
  'server/views/pages/activities/manage-allocations/allocateMultiplePeople/reviewUploadPrisonerList.njk',
)

describe('Views - Manage Allocations - Review Upload Prisoner List', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  const unallocatedInmate = {
    prisonerNumber: 'A1234BC',
    firstName: 'TEST01',
    lastName: 'PRISONER01',
    cellLocation: '1-1-1',
    prisonCode: 'MDI',
    status: 'ACTIVE IN',
    otherAllocations: [],
    nonAssociations: false,
  }

  const viewContext = {
    allocateJourney: {
      activity: {
        activityId: 1,
        name: 'Entry level English 1',
      },
      notFoundPrisoners: [],
    },
    unallocatedInmates: [unallocatedInmate],
    allocatedInmates: [],
    withoutMatchingIncentiveLevelInmates: [],
    user: {
      activeCaseLoadId: 'MDI',
    },
    csv: true,
  }

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should show an already allocated prisoner who cannot be allocated again', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        ...viewContext,
        allocatedInmates: [
          {
            prisonerNumber: 'B2345CD',
            firstName: 'TEST02',
            lastName: 'PRISONER02',
            startDate: '2025-01-01',
          },
        ],
        cannotAllocateMessage: '1 person from your CSV file cannot be allocated',
      }),
    )

    expect($('[data-qa="cannot-allocate-title"]').text().trim()).toBe('1 person from your CSV file cannot be allocated')
    expect($('[data-qa="already-allocated-text"]').text()).toContain(
      'There is 1 person already allocated to Entry level English 1',
    )
    expect($('[data-qa="allocated-inmate-list"] tbody tr')).toHaveLength(1)
  })

  it('should show a prisoner whose incentive level does not match an activity pay rate', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        ...viewContext,
        withoutMatchingIncentiveLevelInmates: [
          {
            prisonerNumber: 'B2345CD',
            firstName: 'TEST02',
            lastName: 'PRISONER02',
            incentiveLevel: 'Enhanced',
          },
        ],
        cannotAllocateMessage: '1 person from your CSV file cannot be allocated',
      }),
    )

    expect($('[data-qa="cannot-allocate-title"]').text().trim()).toBe('1 person from your CSV file cannot be allocated')
    expect($('[data-qa="incentive-level-text"]').text()).toContain(
      'There is 1 person with an incentive level that does not match a pay rate for this activity.',
    )
    expect($('[data-qa="incentive-level-list"] tbody tr')).toHaveLength(1)
  })
})
