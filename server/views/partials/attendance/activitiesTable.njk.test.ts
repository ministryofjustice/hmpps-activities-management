import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import { registerNunjucks } from '../../../nunjucks/nunjucksSetup'

describe('Activities table macro', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  const activity = {
    summary: 'English level 1',
    session: 'AM',
    scheduledInstanceId: 1,
    allowSelection: true,
    attendanceRequired: true,
    startTime: '09:00',
    endTime: '12:00',
    internalLocation: { description: 'Education 1' },
    attendanceSummary: {
      attendees: 1,
      allocations: 1,
      attended: 0,
      notRecorded: 1,
      absences: 0,
    },
  }

  beforeEach(() => {
    const view = `
      {% from "partials/attendance/activitiesTable.njk" import activitiesTable %}
      {{ activitiesTable(activities, activityDate, filterParams, now, isUncancelPage, roles) }}
    `

    compiledTemplate = compile(view, njkEnv)
  })

  const render = (roles: string[] = [], activityDate = new Date('2026-08-22')) =>
    cheerio.load(
      compiledTemplate.render({
        activities: [activity],
        activityDate,
        filterParams: '',
        now: new Date('2026-08-22'),
        isUncancelPage: false,
        roles,
        user: { externalActivitiesRolledOut: false },
      }),
    )

  it('should not render select all for users without the Activity Hub role', () => {
    const $ = render()

    expect($('#select-all')).toHaveLength(0)
  })

  it('should render select all for Activity Hub users', () => {
    const $ = render(['ROLE_ACTIVITY_HUB'])

    expect($('#select-all')).toHaveLength(1)
  })

  it('should limit finding attendees to mark as not required to one selected activity', () => {
    const $ = render(['ROLE_ACTIVITY_HUB'], new Date('2026-08-23'))

    const action = $('button').filter(
      (_, element) => $(element).text().trim() === 'Find attendees to mark as not required',
    )

    expect(action).toHaveLength(1)
    expect(action.attr('data-max-items')).toBe('1')
  })
})
