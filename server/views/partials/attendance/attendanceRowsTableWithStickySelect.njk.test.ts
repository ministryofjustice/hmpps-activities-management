import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import { registerNunjucks } from '../../../nunjucks/nunjucksSetup'

describe('Attendance rows table with sticky select macro', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  const instance = {
    id: 1,
    isInFuture: false,
    startTime: '09:00',
    endTime: '12:00',
    activitySchedule: {
      activity: {
        summary: 'English level 1',
        attendanceRequired: true,
      },
    },
  }

  const attendanceRows = [
    {
      prisoner: {
        firstName: 'Joe',
        middleNames: '',
        lastName: 'Bloggs',
        prisonerNumber: 'A1234AA',
        prisonId: 'MDI',
        cellLocation: '1-001',
        status: 'ACTIVE IN',
      },
      instance,
      attendance: {
        id: 10,
        status: 'WAITING',
        editable: true,
        attendanceReason: {},
        attendanceHistory: [],
      },
      otherEvents: [],
    },
  ]

  beforeEach(() => {
    const view = `
      {% from "partials/attendance/attendanceRowsTableWithStickySelect.njk" import attendanceRowsTableWithStickySelect %}
      {{ attendanceRowsTableWithStickySelect(attendanceRows, instance, activeCaseLoadId, false, false, roles) }}
    `

    compiledTemplate = compile(view, njkEnv)
  })

  const render = (roles: string[] = []) =>
    cheerio.load(
      compiledTemplate.render({
        attendanceRows,
        instance,
        activeCaseLoadId: 'MDI',
        roles,
        user: {
          activeCaseLoadId: 'MDI',
          externalActivitiesRolledOut: false,
        },
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
})
