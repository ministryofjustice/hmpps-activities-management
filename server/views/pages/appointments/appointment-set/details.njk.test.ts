import * as cheerio from 'cheerio'
import { compile } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentSetDetails } from '../../../../@types/activitiesAPI/types'

const view = fs.readFileSync('server/views/pages/appointments/appointment-set/details.njk')

describe('Views - Appointments Management - Appointment Set Details', () => {
  const compiledTemplate = compile(view.toString(), registerNunjucks())
  const appointmentSet = {
    id: 20,
    appointmentName: 'Medical appointments',
    startDate: '2023-05-26',
    appointments: [
      {
        id: 100,
        startDate: '2023-05-26',
        startTime: '09:00',
        endTime: '09:30',
        attendees: [
          {
            prisoner: {
              firstName: 'TEST',
              lastName: 'PRISONER',
              prisonerNumber: 'A1234BC',
              prisonCode: 'MDI',
              status: 'ACTIVE IN',
              cellLocation: '1-1-1',
            },
          },
        ],
      },
    ],
  } as AppointmentSetDetails

  const context = {
    appointmentSet,
    user: { activeCaseLoadId: 'MDI' },
    userMap: new Map(),
    showPrintMovementSlipsLink: false,
  }

  it('should retain the dashboard URL when linking to an appointment', () => {
    const returnUrl = '/appointments/search?startDate=2023-05-26&locationId=LOCATION-1'
    const $ = cheerio.load(compiledTemplate.render({ ...context, returnUrl }))

    expect($('[data-qa=view-and-edit-appointment-100] a').attr('href')).toBe(
      `/appointments/100?returnUrl=${encodeURIComponent(returnUrl)}`,
    )
  })

  it('should use the appointment date for the dashboard URL when no retained URL exists', () => {
    const $ = cheerio.load(compiledTemplate.render(context))

    expect($('[data-qa=view-and-edit-appointment-100] a').attr('href')).toBe(
      `/appointments/100?returnUrl=${encodeURIComponent('/appointments/search?startDate=2023-05-26')}`,
    )
  })
})
