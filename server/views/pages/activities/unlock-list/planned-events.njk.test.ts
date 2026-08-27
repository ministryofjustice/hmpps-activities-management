import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import config from '../../../../config'

const view = fs.readFileSync('server/views/pages/activities/unlock-list/planned-events.njk')

describe('Views - Unlock list', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
    viewContext = {
      location: {
        name: 'Wing A',
        key: 'WING_A',
      },
      date: '2024-01-15',
      timeSlot: 'AM',
      movementCounts: {
        leavingWing: 2,
        stayingOnWing: 1,
      },
      unlockListItems: [
        {
          prisonerNumber: 'A1111AA',
          isLeavingWing: true,
          firstName: 'John',
          lastName: 'Doe',
          cellLocation: '1-1-001',
          alerts: [],
          events: [],
        },
        {
          prisonerNumber: 'B2222BB',
          isLeavingWing: true,
          firstName: 'Jane',
          lastName: 'Smith',
          cellLocation: '1-1-002',
          alerts: [],
          events: [],
        },
        {
          prisonerNumber: 'C3333CC',
          isLeavingWing: false,
          firstName: 'Bob',
          lastName: 'Jones',
          cellLocation: '1-1-003',
          alerts: [],
          events: [],
        },
      ],
      unlockListJourney: {
        searchTerm: '',
        alertFilters: [],
      },
      user: {
        username: 'TEST_USER',
        roles: [],
        activeCaseLoadId: 'MDI',
      },
    }
  })

  it('search unlock list', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text().trim()).toEqual('Wing A - Unlock list')
    expect($('.govuk-caption-l').eq(0).text().trim()).toEqual('AM session')
    expect($('.govuk-caption-l').eq(1).text().trim()).toEqual('Monday, 15 January 2024')
    expect(
      $('.govuk-body')
        .map((i, e) => $(e).text().trim())
        .get(),
    ).toContain('3 people to unlock')
    expect(
      $('.govuk-body')
        .map((i, e) => $(e).text().trim())
        .get(),
    ).toContain('2 leaving wing')
    expect(
      $('.govuk-body')
        .map((i, e) => $(e).text().trim())
        .get(),
    ).toContain('1 staying on wing')
    expect($('.govuk-form-group > .govuk-label').text().trim()).toEqual(
      'Search by name or prison number, or event name',
    )
    expect($('.search-input__form-inputs > .govuk-button').text().trim()).toEqual('Search')
  })

  it('renders relevant alerts when alert filters are applied', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        ...viewContext,
        unlockListJourney: {
          searchTerm: '',
          alertFilters: ['ALERT_XCU', 'ALERT_PEEP'],
        },
        unlockListItems: [
          {
            prisonerNumber: 'A1111AA',
            isLeavingWing: true,
            firstName: 'John',
            lastName: 'Doe',
            cellLocation: '1-1-001',
            alerts: [{ alertCode: 'XCU' }, { alertCode: 'PEEP' }],
            events: [
              {
                eventType: 'ACTIVITY',
                eventSource: 'SAA',
                scheduledInstanceId: 1,
                summary: 'Pottery AM',
                startTime: '09:00',
                endTime: '10:00',
                internalLocationDescription: 'Workshop 1',
              },
            ],
          },
        ],
      }),
    )

    expect($('.alerts-list').text()).toContain('Controlled Unlock')
    expect($('.alerts-list').text()).toContain('PEEP')
  })

  it('renders not required unless the prisoner is suspended', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        ...viewContext,
        unlockListItems: [
          {
            prisonerNumber: 'A1111AA',
            isLeavingWing: true,
            firstName: 'John',
            lastName: 'Doe',
            cellLocation: '1-1-001',
            alerts: [],
            events: [
              {
                eventType: 'ACTIVITY',
                eventSource: 'SAA',
                scheduledInstanceId: 1,
                summary: 'Pottery AM',
                startTime: '09:00',
                endTime: '10:00',
                internalLocationDescription: 'Workshop 1',
                attendanceReasonCode: 'NOT_REQUIRED',
                suspended: false,
                autoSuspended: false,
              },
              {
                eventType: 'ACTIVITY',
                eventSource: 'SAA',
                scheduledInstanceId: 2,
                summary: 'Tailors AM',
                startTime: '10:00',
                endTime: '11:00',
                internalLocationDescription: 'Workshop 2',
                attendanceReasonCode: 'NOT_REQUIRED',
                suspended: true,
                autoSuspended: false,
              },
            ],
          },
        ],
      }),
    )

    const events = $('.unlock-list-event')

    expect(events.eq(0).text()).toContain('Pottery AM')
    expect(events.eq(0).text()).toContain('Not required')

    expect(events.eq(1).text()).toContain('Tailors AM')
    expect(events.eq(1).text()).toContain('Prisoner suspended')
    expect(events.eq(1).text()).not.toContain('Not required')
  })

  describe('with prisoner extra information enabled', () => {
    config.prisonerExtraInformationEnabled = true

    const njkEnv = registerNunjucks()
    const compiledTemplate = compile(view.toString(), njkEnv)

    it('renders extra information for appointments with staff or prisoner comments', () => {
      config.prisonerExtraInformationEnabled = true

      const $ = cheerio.load(
        compiledTemplate.render({
          ...viewContext,
          unlockListItems: [
            {
              prisonerNumber: 'A1111AA',
              isLeavingWing: true,
              firstName: 'John',
              lastName: 'Doe',
              cellLocation: '1-1-001',
              alerts: [],
              events: [
                {
                  eventType: 'APPOINTMENT',
                  eventSource: 'SAA',
                  appointmentId: 38314,
                  summary: 'Chaplaincy',
                  startTime: '09:00',
                  endTime: '10:00',
                  comments: 'Staff comment',
                },
                {
                  eventType: 'APPOINTMENT',
                  eventSource: 'SAA',
                  appointmentId: 38315,
                  summary: 'Healthcare',
                  startTime: '10:00',
                  endTime: '11:00',
                  prisonerComments: 'Prisoner information',
                },
              ],
            },
          ],
        }),
      )

      expect($('[data-qa="extra-info-tag-38314"]')).toHaveLength(1)
      expect($('[data-qa="extra-info-tag-38315"]')).toHaveLength(1)
    })
  })
})
