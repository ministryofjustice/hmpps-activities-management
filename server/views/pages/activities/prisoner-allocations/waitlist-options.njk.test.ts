import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/prisoner-allocations/waitlist-options.njk')

describe('Views - Prisoner allocations - Waitlist options', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should render approved and pending waitlist applications as allocation options', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        prisonerName: 'Aeticake Potta',
        waitlistApprovedPendingApplications: [
          {
            id: 213,
            scheduleId: 518,
            status: 'APPROVED',
            requestedDate: '2025-06-24',
            requestedBy: 'PRISONER',
            comments: 'Test',
            creationTime: '2025-06-24T08:34:22',
            statusUpdatedTime: '2025-07-16T15:20:10',
            activity: {
              activityName: 'Maths level 1',
            },
          },
          {
            id: 214,
            scheduleId: 519,
            status: 'PENDING',
            requestedDate: '2025-07-20',
            requestedBy: 'PRISONER',
            comments: 'Pending test',
            creationTime: '2025-07-20T10:00:00',
            activity: {
              activityName: 'English level 1',
            },
          },
        ],
        activitiesNotApprovedOrPending: [
          {
            id: 520,
            activityName: 'Art',
          },
        ],
        formResponses: {
          activity: {},
        },
        validationErrors: [],
      }),
    )

    expect($('span.govuk-caption-l').text().trim()).toBe('Allocate to an activity')

    expect($('.govuk-fieldset__legend').text().replace(/\s+/g, ' ').trim()).toBe(
      'Select an activity to allocate Aeticake Potta',
    )

    const radios = $('input[name="waitlistScheduleId"]')

    expect(radios).toHaveLength(3)
    expect(radios.eq(0).attr('value')).toBe('518')
    expect(radios.eq(1).attr('value')).toBe('519')

    const radioItems = $('.govuk-radios__item')

    expect(radioItems.eq(0).text().replace(/\s+/g, ' ').trim()).toContain('Maths level 1')
    expect(radioItems.eq(0).text().replace(/\s+/g, ' ').trim()).toContain('Approved on 16 July 2025')

    expect(radioItems.eq(1).text().replace(/\s+/g, ' ').trim()).toContain('English level 1')
    expect(radioItems.eq(1).text().replace(/\s+/g, ' ').trim()).toContain('Application not yet approved')

    expect(radioItems.eq(2).text().replace(/\s+/g, ' ').trim()).toContain('A different activity')
  })

  it('should render the waitlist application data required when submitting a selected application', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        prisonerName: 'Aeticake Potta',
        waitlistApprovedPendingApplications: [
          {
            id: 213,
            scheduleId: 518,
            status: 'APPROVED',
            requestedDate: '2025-06-24',
            requestedBy: 'PRISONER',
            comments: 'Test',
            creationTime: '2025-06-24T08:34:22',
            activity: {
              activityName: 'Maths level 1',
            },
          },
        ],
        activitiesNotApprovedOrPending: [],
        formResponses: {
          activity: {},
        },
        validationErrors: [],
      }),
    )

    expect($('input[name="waitlistApplicationData[0][activityName]"]').attr('value')).toBe('Maths level 1')

    expect($('input[name="waitlistApplicationData[0][id]"]').attr('value')).toBe('213')

    expect($('input[name="waitlistApplicationData[0][status]"]').attr('value')).toBe('APPROVED')

    expect($('input[name="waitlistApplicationData[0][scheduleId]"]').attr('value')).toBe('518')

    expect($('input[name="waitlistApplicationData[0][requestedDate]"]').attr('value')).toBe('2025-06-24')

    expect($('input[name="waitlistApplicationData[0][requestedBy]"]').attr('value')).toBe('PRISONER')

    expect($('input[name="waitlistApplicationData[0][comments]"]').attr('value')).toBe('Test')
  })
})
