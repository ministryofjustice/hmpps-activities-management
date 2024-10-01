import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/create-an-activity/pay-rate-type.njk')

describe('Views - Activity create - pay rate type', () => {
  const incentiveLevels = [
    {
      levelCode: 'BAS',
      levelName: 'Basic',
      prisonId: 'RSI',
      active: true,
      defaultOnAdmission: false,
      remandTransferLimitInPence: 2500,
      remandSpendLimitInPence: 25000,
      convictedTransferLimitInPence: 550,
      convictedSpendLimitInPence: 5500,
      visitOrders: 2,
      privilegedVisitOrders: 0,
    },
    {
      levelCode: 'STD',
      levelName: 'Standard',
      prisonId: 'RSI',
      active: true,
      defaultOnAdmission: true,
      remandTransferLimitInPence: 5500,
      remandSpendLimitInPence: 55000,
      convictedTransferLimitInPence: 1980,
      convictedSpendLimitInPence: 19800,
      visitOrders: 2,
      privilegedVisitOrders: 1,
    },
    {
      levelCode: 'ENH',
      levelName: 'Enhanced',
      prisonId: 'RSI',
      active: true,
      defaultOnAdmission: false,
      remandTransferLimitInPence: 6000,
      remandSpendLimitInPence: 60000,
      convictedTransferLimitInPence: 3300,
      convictedSpendLimitInPence: 33000,
      visitOrders: 2,
      privilegedVisitOrders: 2,
    },
  ]

  let compiledTemplate: Template
  const viewContext = {
    session: {
      createJourney: {
        category: {
          id: 1,
          code: 'SAA_EDUCATION',
          name: 'Education',
        },
        name: 'Test Activity',
        tierCode: 'FOUNDATION',
        riskLevel: 'low',
        attendanceRequired: true,
        paid: true,
      },
    },
    params: {},
    query: {},
    body: {},
    incentiveLevels,
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
  })

  it('Views - Create Activity - pay rate type', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('input[name="incentiveLevel"][type="radio"]').length).toBe(4)
    expect(
      $("[name='incentiveLevel']")
        .map((i, e) => $(e).val())
        .get(),
    ).toEqual(['Basic', 'Standard', 'Enhanced', 'FLAT_RATE'])
  })
})
