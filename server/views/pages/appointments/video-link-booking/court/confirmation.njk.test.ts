import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../../nunjucks/nunjucksSetup'
import { Court, VideoLinkBooking } from '../../../../../@types/bookAVideoLinkApi/types'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'

const view = fs.readFileSync('server/views/pages/appointments/video-link-booking/court/confirmation.njk')

describe('Video link booking - Court - Confirmation page', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
  })

  it('scheduled appointment for one prisoner', () => {
    const viewContext = {
      vlb: {
        videoLinkBookingId: 1,
        statusCode: 'ACTIVE',
        bookingType: 'COURT',
        courtCode: 'Court1',
        prisonAppointments: [
          {
            prisonAppointmentId: 2,
            prisonCode: 'PRISON1',
            prisonerNumber: 'A1234BC',
            appointmentType: 'VLB_COURT',
            appointmentDate: '2025-04-22',
            startTime: '10:30',
            endTime: '11:00',
          },
        ],
        createdBy: 'user1',
        amendedBy: 'user2',
        createdAt: '2025-04-22T10:00:00Z',
      } as VideoLinkBooking,
      court: {
        courtId: 1,
        code: 'Court1',
        description: 'Disabled Court',
        enabled: false,
      } as Court,
      prisoner: {
        prisonerNumber: 'A1234BC',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1980-01-01',
        prisonId: 'PRISON1',
      } as Prisoner,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(
      $('.govuk-body')
        .map((i, e) => $(e).text().trim())
        .get(),
    ).toEqual([
      'You have successfully scheduled an appointment for John Doe on Tuesday, 22 April 2025.',
      'You must email Disabled Court to confirm the booking. This is because they do not yet have access to the Book a video link service.',
      'Schedule another appointment',
      'View, print movement slips and manage this appointment',
    ])
    expect(
      $('h2')
        .map((i, e) => $(e).text().trim())
        .get(),
    ).toEqual(['Email Disabled Court to confirm the booking', 'What you can do next'])
  })
})
