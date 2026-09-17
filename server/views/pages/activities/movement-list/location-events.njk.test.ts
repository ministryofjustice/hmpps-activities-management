import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import config from '../../../../config'

const view = fs.readFileSync('server/views/pages/activities/movement-list/location-events.njk')

describe('Views - Movement list', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  config.prisonerExtraInformationEnabled = true

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)

    viewContext = {
      date: '2024-01-15',
      timeSlot: 'AM',
      outsideList: false,
      location: {
        id: 1,
        description: 'Workshop 1',
        prisonerEvents: [],
      },
      movementListJourney: {
        dateOption: 'TODAY',
        date: '2024-01-15',
        timeSlot: 'AM',
        alertFilters: [],
      },
      user: {
        activeCaseLoadId: 'MDI',
      },
    }
  })

  it('renders relevant alerts', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        ...viewContext,
        movementListJourney: {
          ...(viewContext.movementListJourney as Record<string, unknown>),
          alertFilters: ['ALERT_XCU', 'ALERT_PEEP'],
        },
        location: {
          id: 1,
          description: 'Workshop 1',
          prisonerEvents: [
            {
              prisonerNumber: 'A1111AA',
              firstName: 'John',
              lastName: 'Doe',
              cellLocation: '1-1-001',
              prisonId: 'MDI',
              status: 'ACTIVE IN',
              category: 'C',
              alerts: [{ alertCode: 'XCU' }, { alertCode: 'PEEP' }],
              events: [
                {
                  eventType: 'ACTIVITY',
                  eventSource: 'SAA',
                  scheduledInstanceId: 1,
                  summary: 'Pottery',
                  startTime: '09:00',
                  endTime: '10:00',
                  internalLocationId: 1,
                },
              ],
              clashingEvents: [],
            },
          ],
        },
      }),
    )

    const alerts = $('[data-qa="location-prisoner-1-alerts"]')

    expect(alerts.text()).toContain('Controlled Unlock')
    expect(alerts.text()).toContain('PEEP')
  })

  it('renders not required unless the prisoner is suspended', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        ...viewContext,
        location: {
          id: 1,
          description: 'Workshop 1',
          prisonerEvents: [
            {
              prisonerNumber: 'A1111AA',
              firstName: 'John',
              lastName: 'Doe',
              cellLocation: '1-1-001',
              prisonId: 'MDI',
              status: 'ACTIVE IN',
              category: 'C',
              alerts: [],
              events: [
                {
                  eventType: 'ACTIVITY',
                  eventSource: 'SAA',
                  scheduledInstanceId: 1,
                  summary: 'Woodworking',
                  startTime: '09:00',
                  endTime: '10:00',
                  internalLocationId: 1,
                  attendanceReasonCode: 'NOT_REQUIRED',
                  suspended: false,
                  autoSuspended: false,
                },
                {
                  eventType: 'ACTIVITY',
                  eventSource: 'SAA',
                  scheduledInstanceId: 2,
                  summary: 'Pottery',
                  startTime: '10:00',
                  endTime: '11:00',
                  internalLocationId: 1,
                  attendanceReasonCode: 'NOT_REQUIRED',
                  suspended: true,
                  autoSuspended: false,
                },
              ],
              clashingEvents: [],
            },
          ],
        },
      }),
    )

    const woodworking = $('[data-qa="location-prisoner-1-events"]')
    const pottery = $('[data-qa="location-prisoner-2-events"]')

    expect(woodworking.text()).toContain('Woodworking')
    expect(woodworking.text()).toContain('Not required')

    expect(pottery.text()).toContain('Pottery')
    expect(pottery.text()).toContain('Prisoner suspended')
    expect(pottery.text()).not.toContain('Not required')
  })

  it('renders extra information for appointments with staff or prisoner comments', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        ...viewContext,
        location: {
          id: 1,
          description: 'A Wing',
          prisonerEvents: [
            {
              prisonerNumber: 'A1111AA',
              firstName: 'John',
              lastName: 'Doe',
              cellLocation: '1-1-001',
              prisonId: 'MDI',
              status: 'ACTIVE IN',
              category: 'C',
              alerts: [],
              events: [
                {
                  eventType: 'APPOINTMENT',
                  eventSource: 'SAA',
                  appointmentId: 1,
                  summary: 'Chaplaincy',
                  startTime: '09:00',
                  endTime: '10:00',
                  internalLocationId: 1,
                  comments: 'Staff comment',
                },
                {
                  eventType: 'APPOINTMENT',
                  eventSource: 'SAA',
                  appointmentId: 2,
                  summary: 'Healthcare',
                  startTime: '10:00',
                  endTime: '11:00',
                  internalLocationId: 1,
                  prisonerComments: 'Prisoner comment',
                },
              ],
              clashingEvents: [],
            },
          ],
        },
      }),
    )

    expect($('[data-qa="extra-info-tag-1"]')).toHaveLength(1)
    expect($('[data-qa="extra-info-tag-2"]')).toHaveLength(1)
  })
})
