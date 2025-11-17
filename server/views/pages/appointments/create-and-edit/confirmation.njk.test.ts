import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { addDays, format, subDays } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentJourney, AppointmentType } from '../../../../routes/appointments/create-and-edit/appointmentJourney'
import { AppointmentFrequency } from '../../../../@types/appointments'
import { AppointmentDetails, AppointmentSetDetails } from '../../../../@types/activitiesAPI/types'
import { formatDate } from '../../../../utils/utils'
import { YesNo } from '../../../../@types/activities'

const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/confirmation.njk')

describe('Views - Create Appointment - Confirmation', () => {
  let compiledTemplate: Template
  const tomorrow = addDays(new Date(), 1)
  let viewContext = {
    appointment: {} as AppointmentDetails,
    session: {
      appointmentJourney: {} as AppointmentJourney,
    },
    appointmentSet: null as AppointmentSetDetails,
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
    viewContext = {
      appointment: {} as AppointmentDetails,
      session: {
        appointmentJourney: {} as AppointmentJourney,
      },
      appointmentSet: null as AppointmentSetDetails,
    }
  })

  it('should not display repeat frequency or number of appointments when no schedule is defined', () => {
    viewContext.appointment = {
      appointmentSeries: { schedule: null },
      appointmentType: AppointmentType.GROUP,
      startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
      attendees: [
        {
          prisoner: {
            firstName: 'TEST',
            lastName: 'PRISONER',
          },
        },
      ],
    } as AppointmentDetails

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
      `You have successfully scheduled an appointment for Test Prisoner on ${format(tomorrow, 'EEEE, d MMMM yyyy')}.`,
    )
  })

  it('should display create message when the appointment is retrospective', () => {
    const fiveDaysAgo = subDays(new Date(), 5)
    viewContext.appointment = {
      appointmentSeries: { schedule: null },
      appointmentType: AppointmentType.GROUP,
      startDate: formatDate(fiveDaysAgo, 'yyyy-MM-dd'),
      attendees: [
        {
          prisoner: {
            firstName: 'TEST',
            lastName: 'PRISONER',
          },
        },
      ],
    } as AppointmentDetails

    viewContext.session.appointmentJourney.retrospective = YesNo.YES

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
      `You have successfully created an appointment for Test Prisoner on ${format(fiveDaysAgo, 'EEEE, d MMMM yyyy')}.`,
    )
  })

  it('should display create message for single person in the appointment set', () => {
    viewContext.appointmentSet = {
      id: 114,
      prisonCode: 'RSI',
      appointmentName: 'test (Activities)',
      category: {
        code: 'ACTI',
        description: 'Activities',
      },
      customName: 'test',
      internalLocation: null,
      inCell: true,
      startDate: '2025-04-22',
      appointments: [
        {
          id: 37993,
          appointmentSeries: null,
          appointmentSet: {
            id: 114,
            appointmentCount: 1,
            scheduledAppointmentCount: 1,
          },
          appointmentType: 'INDIVIDUAL',
          sequenceNumber: 1,
          prisonCode: 'RSI',
          appointmentName: 'test (Activities)',
          attendees: [
            {
              id: 231459,
              prisoner: {
                prisonerNumber: 'G6532UD',
                bookingId: 1154508,
                firstName: 'Test01',
                lastName: 'Prisoner01',
                status: 'ACTIVE IN',
                prisonCode: 'RSI',
                cellLocation: 'D-N-1-028',
                category: 'C',
              },
              attended: null,
              attendanceRecordedTime: null,
              attendanceRecordedBy: null,
            },
          ],
          category: {
            code: 'ACTI',
            description: 'Activities',
          },
          tier: {
            id: 1,
            code: 'TIER_1',
            description: 'Tier 1',
          },
          organiser: null,
          customName: 'test',
          internalLocation: null,
          inCell: true,
          startDate: '2025-08-29',
          startTime: '11:00',
          endTime: '12:00',
          isExpired: false,
          extraInformation: null,
          createdTime: '2025-08-28T17:32:48',
          createdBy: 'testuser',
          isEdited: false,
          updatedTime: null,
          updatedBy: null,
          isCancelled: false,
          isDeleted: false,
          cancelledTime: null,
          cancelledBy: null,
        },
      ],
      createdTime: '2025-08-28T17:32:48',
      createdBy: 'testuser',
      updatedTime: null,
      updatedBy: null,
    } as AppointmentSetDetails

    viewContext.session.appointmentJourney.retrospective = YesNo.YES
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
      `You have successfully created an appointment for Test01 Prisoner01 on ${format('2025-04-22', 'EEEE, d MMMM yyyy')}.`,
    )
  })

  it('should display scheduled message for single person in the appointment set', () => {
    viewContext.appointmentSet = {
      id: 114,
      prisonCode: 'RSI',
      appointmentName: 'test (Activities)',
      category: {
        code: 'ACTI',
        description: 'Activities',
      },
      customName: 'test',
      internalLocation: null,
      inCell: true,
      startDate: '2025-04-22',
      appointments: [
        {
          id: 37993,
          appointmentSeries: null,
          appointmentSet: {
            id: 114,
            appointmentCount: 1,
            scheduledAppointmentCount: 1,
          },
          appointmentType: 'INDIVIDUAL',
          sequenceNumber: 1,
          prisonCode: 'RSI',
          appointmentName: 'test (Activities)',
          attendees: [
            {
              id: 231459,
              prisoner: {
                prisonerNumber: 'G6532UD',
                bookingId: 1154508,
                firstName: 'Test01',
                lastName: 'Prisoner01',
                status: 'ACTIVE IN',
                prisonCode: 'RSI',
                cellLocation: 'D-N-1-028',
                category: 'C',
              },
              attended: null,
              attendanceRecordedTime: null,
              attendanceRecordedBy: null,
            },
          ],
          category: {
            code: 'ACTI',
            description: 'Activities',
          },
          tier: {
            id: 1,
            code: 'TIER_1',
            description: 'Tier 1',
          },
          organiser: null,
          customName: 'test',
          internalLocation: null,
          inCell: true,
          startDate: '2025-08-29',
          startTime: '11:00',
          endTime: '12:00',
          isExpired: false,
          extraInformation: null,
          createdTime: '2025-08-28T17:32:48',
          createdBy: 'testuser',
          isEdited: false,
          updatedTime: null,
          updatedBy: null,
          isCancelled: false,
          isDeleted: false,
          cancelledTime: null,
          cancelledBy: null,
        },
      ],
      createdTime: '2025-08-28T17:32:48',
      createdBy: 'testuser',
      updatedTime: null,
      updatedBy: null,
    } as AppointmentSetDetails

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
      `You have successfully scheduled an appointment for Test01 Prisoner01 on ${format('2025-04-22', 'EEEE, d MMMM yyyy')}.`,
    )
  })

  it.each([
    { frequency: AppointmentFrequency.WEEKDAY, expectedText: 'every weekday (Monday to Friday)' },
    { frequency: AppointmentFrequency.DAILY, expectedText: 'daily (includes weekends)' },
    { frequency: AppointmentFrequency.WEEKLY, expectedText: 'weekly' },
    { frequency: AppointmentFrequency.FORTNIGHTLY, expectedText: 'fortnightly' },
    { frequency: AppointmentFrequency.MONTHLY, expectedText: 'monthly' },
  ])(
    'frequency $frequency should be displayed as $expectedText with number of appointments when repeat = YES',
    ({ frequency, expectedText }) => {
      viewContext.appointment = {
        appointmentSeries: { schedule: { frequency, numberOfAppointments: 6 } },
        appointmentType: AppointmentType.GROUP,
        startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
        attendees: [
          {
            prisoner: {
              firstName: 'TEST',
              lastName: 'PRISONER',
            },
          },
        ],
      } as AppointmentDetails

      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
        `You have successfully scheduled an appointment for Test Prisoner starting on ${format(
          tomorrow,
          'EEEE, d MMMM yyyy',
        )}. It will repeat ${expectedText} for 6 appointments.`,
      )
    },
  )

  describe('Group Appointment', () => {
    it('should display number of prisoners scheduled to appointment', () => {
      viewContext.appointment = {
        appointmentSeries: { schedule: null },
        appointmentType: AppointmentType.GROUP,
        startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
        attendees: [
          {
            prisoner: {
              firstName: 'TEST',
              lastName: 'PRISONER',
            },
          },
          {
            prisoner: {
              firstName: 'SECOND',
              lastName: 'PRISONER',
            },
          },
          {
            prisoner: {
              firstName: 'THIRD',
              lastName: 'PRISONER',
            },
          },
        ],
      } as AppointmentDetails

      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
        `You have successfully scheduled an appointment for 3 people on ${format(tomorrow, 'EEEE, d MMMM yyyy')}.`,
      )
    })

    it('should display number of prisoners added to appointment', () => {
      viewContext.appointment = {
        appointmentSeries: { schedule: null },
        appointmentType: AppointmentType.GROUP,
        startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
        attendees: [
          {
            prisoner: {
              firstName: 'TEST',
              lastName: 'PRISONER',
            },
          },
          {
            prisoner: {
              firstName: 'SECOND',
              lastName: 'PRISONER',
            },
          },
        ],
      } as AppointmentDetails

      viewContext.session.appointmentJourney.retrospective = YesNo.YES
      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
        `You have successfully created an appointment for 2 people on ${format(tomorrow, 'EEEE, d MMMM yyyy')}.`,
      )
    })

    it('should display number of prisoners added to appointment from appointment set', () => {
      viewContext.appointmentSet = {
        id: 115,
        prisonCode: 'RSI',
        appointmentName: 'test (Activities)',
        category: {
          code: 'ACTI',
          description: 'Activities',
        },
        customName: 'test',
        internalLocation: null,
        inCell: true,
        startDate: '2025-04-22',
        appointments: [
          {
            id: 37994,
            appointmentSeries: null,
            appointmentSet: {
              id: 115,
              appointmentCount: 2,
              scheduledAppointmentCount: 2,
            },
            appointmentType: 'INDIVIDUAL',
            sequenceNumber: 1,
            prisonCode: 'RSI',
            appointmentName: 'test (Activities)',
            attendees: [
              {
                id: 231460,
                prisoner: {
                  prisonerNumber: 'G6532UD',
                  bookingId: 1154508,
                  firstName: 'ABOMINPHER',
                  lastName: 'PETIO',
                  status: 'ACTIVE IN',
                  prisonCode: 'RSI',
                  cellLocation: 'D-N-1-028',
                  category: 'C',
                },
                attended: null,
                attendanceRecordedTime: null,
                attendanceRecordedBy: null,
              },
            ],
            category: {
              code: 'ACTI',
              description: 'Activities',
            },
            tier: {
              id: 1,
              code: 'TIER_1',
              description: 'Tier 1',
            },
            organiser: null,
            customName: 'test',
            internalLocation: null,
            inCell: true,
            startDate: '2025-04-22',
            startTime: '11:00',
            endTime: '12:00',
            isExpired: false,
            extraInformation: null,
            createdTime: '2025-08-29T09:50:48',
            createdBy: 'testuser',
            isEdited: false,
            updatedTime: null,
            updatedBy: null,
            isCancelled: false,
            isDeleted: false,
            cancelledTime: null,
            cancelledBy: null,
          },
          {
            id: 37995,
            appointmentSeries: null,
            appointmentSet: {
              id: 115,
              appointmentCount: 2,
              scheduledAppointmentCount: 2,
            },
            appointmentType: 'INDIVIDUAL',
            sequenceNumber: 1,
            prisonCode: 'RSI',
            appointmentName: 'test (Activities)',
            attendees: [
              {
                id: 231461,
                prisoner: {
                  prisonerNumber: 'G8634UD',
                  bookingId: 1136879,
                  firstName: 'EGURZTOF',
                  lastName: 'ANNOLE',
                  status: 'ACTIVE IN',
                  prisonCode: 'RSI',
                  cellLocation: 'E-S-2-014',
                  category: 'C',
                },
                attended: null,
                attendanceRecordedTime: null,
                attendanceRecordedBy: null,
              },
            ],
            category: {
              code: 'ACTI',
              description: 'Activities',
            },
            tier: {
              id: 1,
              code: 'TIER_1',
              description: 'Tier 1',
            },
            organiser: null,
            customName: 'test',
            internalLocation: null,
            inCell: true,
            startDate: '2025-04-22',
            startTime: '10:00',
            endTime: '12:00',
            isExpired: false,
            extraInformation: null,
            createdTime: '2025-08-29T09:50:48',
            createdBy: 'testuser',
            isEdited: false,
            updatedTime: null,
            updatedBy: null,
            isCancelled: false,
            isDeleted: false,
            cancelledTime: null,
            cancelledBy: null,
          },
        ],
        createdTime: '2025-08-29T09:50:48',
        createdBy: 'testuser',
        updatedTime: null,
        updatedBy: null,
      } as AppointmentSetDetails

      viewContext.session.appointmentJourney.retrospective = YesNo.YES
      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
        `You have successfully created appointments for 2 people starting on ${format('2025-04-22', 'EEEE, d MMMM yyyy')}.`,
      )
    })

    it('should display number of prisoners scheduled to appointment from appointment set', () => {
      viewContext.appointmentSet = {
        id: 115,
        prisonCode: 'RSI',
        appointmentName: 'test (Activities)',
        category: {
          code: 'ACTI',
          description: 'Activities',
        },
        customName: 'test',
        internalLocation: null,
        inCell: true,
        startDate: '2025-04-22',
        appointments: [
          {
            id: 37994,
            appointmentSeries: null,
            appointmentSet: {
              id: 115,
              appointmentCount: 2,
              scheduledAppointmentCount: 2,
            },
            appointmentType: 'INDIVIDUAL',
            sequenceNumber: 1,
            prisonCode: 'RSI',
            appointmentName: 'test (Activities)',
            attendees: [
              {
                id: 231460,
                prisoner: {
                  prisonerNumber: 'G6532UD',
                  bookingId: 1154508,
                  firstName: 'ABOMINPHER',
                  lastName: 'PETIO',
                  status: 'ACTIVE IN',
                  prisonCode: 'RSI',
                  cellLocation: 'D-N-1-028',
                  category: 'C',
                },
                attended: null,
                attendanceRecordedTime: null,
                attendanceRecordedBy: null,
              },
            ],
            category: {
              code: 'ACTI',
              description: 'Activities',
            },
            tier: {
              id: 1,
              code: 'TIER_1',
              description: 'Tier 1',
            },
            organiser: null,
            customName: 'test',
            internalLocation: null,
            inCell: true,
            startDate: '2025-04-22',
            startTime: '11:00',
            endTime: '12:00',
            isExpired: false,
            extraInformation: null,
            createdTime: '2025-08-29T09:50:48',
            createdBy: 'testuser',
            isEdited: false,
            updatedTime: null,
            updatedBy: null,
            isCancelled: false,
            isDeleted: false,
            cancelledTime: null,
            cancelledBy: null,
          },
          {
            id: 37995,
            appointmentSeries: null,
            appointmentSet: {
              id: 115,
              appointmentCount: 2,
              scheduledAppointmentCount: 2,
            },
            appointmentType: 'INDIVIDUAL',
            sequenceNumber: 1,
            prisonCode: 'RSI',
            appointmentName: 'test (Activities)',
            attendees: [
              {
                id: 231461,
                prisoner: {
                  prisonerNumber: 'G8634UD',
                  bookingId: 1136879,
                  firstName: 'EGURZTOF',
                  lastName: 'ANNOLE',
                  status: 'ACTIVE IN',
                  prisonCode: 'RSI',
                  cellLocation: 'E-S-2-014',
                  category: 'C',
                },
                attended: null,
                attendanceRecordedTime: null,
                attendanceRecordedBy: null,
              },
            ],
            category: {
              code: 'ACTI',
              description: 'Activities',
            },
            tier: {
              id: 1,
              code: 'TIER_1',
              description: 'Tier 1',
            },
            organiser: null,
            customName: 'test',
            internalLocation: null,
            inCell: true,
            startDate: '2025-04-22',
            startTime: '10:00',
            endTime: '12:00',
            isExpired: false,
            extraInformation: null,
            createdTime: '2025-08-29T09:50:48',
            createdBy: 'testuser',
            isEdited: false,
            updatedTime: null,
            updatedBy: null,
            isCancelled: false,
            isDeleted: false,
            cancelledTime: null,
            cancelledBy: null,
          },
        ],
        createdTime: '2025-08-29T09:50:48',
        createdBy: 'testuser',
        updatedTime: null,
        updatedBy: null,
      } as AppointmentSetDetails

      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
        `You have successfully scheduled appointments for 2 people starting on ${format('2025-04-22', 'EEEE, d MMMM yyyy')}.`,
      )
    })
  })
})
