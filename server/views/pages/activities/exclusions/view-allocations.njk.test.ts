import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/exclusions/view-allocations.njk')

describe('Views - Exclusions - View allocations', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  const scheduledSlots = {
    1: [
      {
        day: 'Monday',
        slots: [{ timeSlot: 'AM', startTime: '09:00', endTime: '10:00' }],
      },
    ],
  }

  const activities = [
    {
      activityName: 'Gym',
      allocation: {
        id: 1,
        status: 'SUSPENDED_WITH_PAY',
        plannedSuspension: {
          plannedStartDate: '2024-12-13',
        },
      },
      currentWeek: 1,
      scheduledSlots,
      scheduleLastChanged: null,
    },
    {
      activityName: 'Entry level Maths 1',
      allocation: {
        id: 2,
        status: 'SUSPENDED',
        plannedSuspension: {
          plannedStartDate: '2024-12-13',
        },
      },
      currentWeek: 1,
      scheduledSlots,
      scheduleLastChanged: null,
    },
    {
      activityName: 'CIT Plastering',
      allocation: {
        id: 3,
        status: 'ACTIVE',
        plannedSuspension: {},
      },
      currentWeek: 1,
      scheduledSlots,
      scheduleLastChanged: null,
    },
  ]

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  const render = () =>
    cheerio.load(
      compiledTemplate.render({
        prisonerName: 'Joe Bloggs',
        prisonerNumber: 'A5015DY',
        activities,
        now: new Date('2024-12-13'),
      }),
    )

  it('should show suspension badges and links for suspended allocations', () => {
    const $ = render()

    expect($('[data-qa="suspension-badge"]')).toHaveLength(2)

    const suspensionLinks = $('[data-qa="suspension-link"]')

    expect(suspensionLinks).toHaveLength(2)
    expect(suspensionLinks.eq(0).attr('href')).toBe(
      '/activities/suspensions/prisoner/A5015DY/view-suspensions?allocationId=1',
    )
    expect(suspensionLinks.eq(1).attr('href')).toBe(
      '/activities/suspensions/prisoner/A5015DY/view-suspensions?allocationId=2',
    )
  })

  it('should link each allocation to its exclusions edit journey', () => {
    const $ = render()

    const changeLinks = $('.govuk-summary-list__actions a')

    expect(changeLinks).toHaveLength(3)
    expect(changeLinks.eq(0).attr('href')).toBe('/activities/allocations/exclude/1/exclusions')
    expect(changeLinks.eq(1).attr('href')).toBe('/activities/allocations/exclude/2/exclusions')
    expect(changeLinks.eq(2).attr('href')).toBe('/activities/allocations/exclude/3/exclusions')
  })
})
