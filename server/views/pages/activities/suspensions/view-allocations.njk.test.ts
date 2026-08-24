import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/suspensions/view-allocations.njk')

describe('Views - Suspensions - View allocations', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  const baseContext = {
    prisonerName: 'Alfonso Cholak',
    prisonerNumber: 'G0995GW',
    allocationCount: 2,
    activeAllocationIdsForSuspending: [],
    session: {
      req: {
        params: {
          prisonerNumber: 'G0995GW',
        },
      },
    },
    user: {
      externalActivitiesRolledOut: false,
    },
  }

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('renders all-suspended state and preserves unpaid activities as unpaid', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        ...baseContext,
        activeAllocations: [],
        suspendedAllocations: [
          {
            id: 1,
            activityId: 10,
            activitySummary: 'Paid activity',
            prisonPayBand: { id: 1 },
            status: 'SUSPENDED_WITH_PAY',
            plannedSuspension: {
              plannedStartDate: '2026-08-20',
              plannedEndDate: null,
              paid: true,
            },
          },
          {
            id: 2,
            activityId: 20,
            activitySummary: 'Unpaid activity',
            prisonPayBand: null,
            status: 'SUSPENDED_WITH_PAY',
            plannedSuspension: {
              plannedStartDate: '2026-08-20',
              plannedEndDate: null,
              paid: true,
            },
          },
        ],
      }),
    )

    expect($('[data-qa="no-active-allocations"]').text()).toContain(
      "Alfonso Cholak is currently suspended from every activity that they're allocated to.",
    )

    expect($('[data-qa="active-allocations"]')).toHaveLength(0)

    const suspendedRows = $('[data-qa="suspended-allocations"] tbody tr')

    expect(suspendedRows).toHaveLength(2)

    expect(suspendedRows.eq(0).text()).toContain('Paid activity')
    expect(suspendedRows.eq(0).text()).toContain('Yes')

    expect(suspendedRows.eq(1).text()).toContain('Unpaid activity')
    expect(suspendedRows.eq(1).text()).toContain('No - activity is unpaid')

    expect($('[data-qa="end-all-suspensions-button"]')).toHaveLength(1)

    expect($('[data-qa="suspend-all-button"]')).toHaveLength(0)
  })

  it('renders active and suspended allocations without bulk actions', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        ...baseContext,
        allocationCount: 4,
        activeAllocationIdsForSuspending: [3, 4],
        activeAllocations: [
          {
            id: 3,
            activityId: 30,
            activitySummary: 'Paid active activity',
            startDate: '2026-08-01',
            endDate: null,
            payRate: 100,
          },
          {
            id: 4,
            activityId: 40,
            activitySummary: 'Unpaid active activity',
            startDate: '2026-08-02',
            endDate: null,
            payRate: null,
          },
        ],
        suspendedAllocations: [
          {
            id: 1,
            activityId: 10,
            activitySummary: 'Paid suspension',
            prisonPayBand: { id: 1 },
            status: 'SUSPENDED_WITH_PAY',
            plannedSuspension: {
              plannedStartDate: '2026-08-20',
              plannedEndDate: null,
              paid: true,
            },
          },
          {
            id: 2,
            activityId: 20,
            activitySummary: 'Unpaid suspension',
            prisonPayBand: null,
            status: 'SUSPENDED',
            plannedSuspension: {
              plannedStartDate: '2026-08-21',
              plannedEndDate: null,
              paid: false,
            },
          },
        ],
      }),
    )

    const activeRows = $('[data-qa="active-allocations"] tbody tr')

    expect(activeRows).toHaveLength(2)

    expect(activeRows.eq(0).text()).toContain('Paid active activity')
    expect(activeRows.eq(0).text()).toContain('£1.00')

    expect(activeRows.eq(1).text()).toContain('Unpaid active activity')
    expect(activeRows.eq(1).text()).toContain('Unpaid')

    expect($('[data-qa="suspended-allocations"] tbody tr')).toHaveLength(2)

    expect($('[data-qa="suspend-all-button"]')).toHaveLength(0)

    expect($('[data-qa="end-all-suspensions-button"]')).toHaveLength(0)
  })
})
