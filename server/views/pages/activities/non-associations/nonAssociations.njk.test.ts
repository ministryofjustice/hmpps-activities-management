import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/non-associations/nonAssociations.njk')

describe('Views - Non Associations for an activity', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    viewContext = {
      prisoner: {
        name: 'Aeticake Potta',
        firstName: 'Aeticake',
        lastName: 'Potta',
        cellLocation: '1-1-1',
        status: 'ACTIVE IN',
        prisonCode: 'MDI',
        prisonerNumber: 'G4977UO',
        prisonName: 'HMP Risley',
      },
      prisonerName: 'Alishole Egurztofy',
      activity: {
        description: 'Kitchen Cleaning',
      },
    }
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('look for non associations', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text().trim()).toEqual('Aeticake Potta’s non-associations')
    expect($('[data-qa=para1]').text().trim()).toEqual(
      'Check if attending this activity could mean Aeticake Potta coming into contact with someone they must be kept apart from.',
    )
    expect($('h2').text().trim()).toContain('People allocated to Kitchen Cleaning')
    expect($('[data-qa=noNA-activity]').text().trim()).toEqual(
      'Aeticake Potta has no open non-associations with anyone who is allocated to Kitchen Cleaning.',
    )
    expect($('h2').text().trim()).toContain('Other people in HMP Risley')
    expect($('[data-qa=noNA-prison]').text().trim()).toEqual(
      'Aeticake Potta has no open non-associations with anyone else in HMP Risley.',
    )
  })

  it('renders non-associations and links allocations to the activity dashboard', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        ...viewContext,
        user: {
          externalActivitiesRolledOut: false,
        },
        allocatedNonAssociations: [
          {
            allocated: true,
            reasonDescription: 'Bullying',
            roleDescription: 'Perpetrator',
            restrictionTypeDescription: 'Cell and landing',
            comments: 'Keep apart',
            whenUpdated: '2024-10-15T14:26:58',
            otherPrisonerDetails: {
              prisonerNumber: 'G6512VC',
              firstName: 'IZRMONNTAS',
              lastName: 'ADALIE',
              cellLocation: 'A-N-2-24S',
            },
            allocations: [
              {
                activitySummary: 'Barbering A',
                activityId: 858,
                schedule: {
                  activity: {
                    inCell: false,
                    onWing: false,
                    offWing: false,
                    outsideWork: false,
                  },
                  internalLocation: {
                    description: 'Education - R1',
                  },
                },
              },
            ],
          },
        ],
        unallocatedNonAssociations: [
          {
            allocated: false,
            reasonDescription: 'Gang related',
            roleDescription: 'Perpetrator',
            restrictionTypeDescription: 'Cell, landing and wing',
            comments: 'Keep apart from this prisoner',
            whenUpdated: '2024-08-08T12:37:16',
            otherPrisonerDetails: {
              prisonerNumber: 'G6815UH',
              firstName: 'UZFANAYE',
              lastName: 'ALANOINE',
              cellLocation: 'E-1-14S',
            },
            allocations: [
              {
                activitySummary: 'Box making',
                activityId: 58,
                schedule: {
                  activity: {
                    inCell: false,
                    onWing: false,
                    offWing: false,
                    outsideWork: false,
                  },
                  internalLocation: {
                    description: 'Education - R2',
                  },
                },
              },
            ],
          },
        ],
      }),
    )

    const tables = $('[data-qa="na-table"]')

    expect(tables).toHaveLength(2)

    const allocatedTable = tables.eq(0).text().replace(/\s+/g, ' ').trim()

    expect(allocatedTable).toContain('Adalie, Izrmonntas')
    expect(allocatedTable).toContain('G6512VC')
    expect(allocatedTable).toContain('A-N-2-24S')
    expect(allocatedTable).toContain('Barbering A')
    expect(allocatedTable).toContain('Education - R1')
    expect(allocatedTable).toContain('Where to keep apart: Cell and landing')
    expect(allocatedTable).toContain('Reason: Bullying')
    expect(allocatedTable).toContain('Comments: Keep apart')
    expect(allocatedTable).toContain('Aeticake Potta’s role: Perpetrator')
    expect(allocatedTable).toContain('15 October 2024')

    expect($('[data-qa="allocation-858"]').attr('href')).toBe('/activities/allocation-dashboard/858')

    const unallocatedTable = tables.eq(1).text().replace(/\s+/g, ' ').trim()

    expect(unallocatedTable).toContain('Alanoine, Uzfanaye')
    expect(unallocatedTable).toContain('G6815UH')
    expect(unallocatedTable).toContain('E-1-14S')
    expect(unallocatedTable).toContain('Box making')
    expect(unallocatedTable).toContain('Education - R2')
    expect(unallocatedTable).toContain('Where to keep apart: Cell, landing and wing')
    expect(unallocatedTable).toContain('Reason: Gang related')
    expect(unallocatedTable).toContain('8 August 2024')
  })
})
