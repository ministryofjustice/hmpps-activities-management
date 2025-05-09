import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../../nunjucks/nunjucksSetup'
import { VideoLinkBooking } from '../../../../../@types/bookAVideoLinkApi/types'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'

const view = fs.readFileSync('server/views/pages/appointments/video-link-booking/probation/confirmation.njk')

describe('Video link booking - Probation - Confirmation page', () => {
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
        bookingType: 'PROBATION',
        probationTeamCode: 'Team1',
        prisonAppointments: [
          {
            prisonAppointmentId: 2,
            prisonCode: 'PRISON1',
            prisonerNumber: 'A1234BC',
            appointmentType: 'VLB_PROBATION',
            appointmentDate: '2025-04-22',
            startTime: '10:30',
            endTime: '11:00',
          },
        ],
        createdBy: 'user1',
        amendedBy: 'user2',
        createdAt: '2025-04-22T10:00:00Z',
      } as VideoLinkBooking,
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
      'The probation team will not automatically receive confirmation of this booking. You must email them to confirm.',
      'Schedule another appointment',
      'View, print movement slips and manage this appointment',
    ])
    expect(
      $('#main-content h2')
        .map((i, e) => $(e).text().trim())
        .get(),
    ).toEqual(['Email the probation team this booking is for to confirm', 'What you can do next'])
  })
})
